const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const os = require("os");

/**
 * Runs Python code against a set of test cases in an isolated child process.
 * Writes to an OS-level temporary file to avoid command-line string limits.
 */
const runPythonCode = async (code, testCases) => {
  const wrapperScript = `
import sys
import json
import time
from io import StringIO

# Map JavaScript JSON booleans/null to Python equivalents
true = True
false = False
null = None

# 1. Suppress global prints to protect the final JSON output
old_stdout = sys.stdout
sys.stdout = StringIO()

# User Code
${code}

test_cases = ${JSON.stringify(testCases)}
results = []

for tc in test_cases:
    try:
        # Redirect stdout specifically for this test case
        redirected_output = sys.stdout = StringIO()
        
        exec(tc["input"]) 
        
        actual_output = redirected_output.getvalue().strip()
        passed = str(actual_output) == str(tc["expectedOutput"])
        results.append({"passed": passed, "actual": actual_output, "expected": tc["expectedOutput"]})
        
    except Exception as e:
        results.append({"passed": False, "error": str(e)})

# 2. Restore standard output just to print the valid JSON array
sys.stdout = old_stdout
print(json.dumps(results))
`;

  // Use the operating system's temporary directory
  const tempFileName = `temp_exec_${crypto.randomUUID()}.py`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);

  // Await the file write BEFORE creating the Promise wrapper
  try {
    await fs.writeFile(tempFilePath, wrapperScript);
  } catch (err) {
    throw new Error("Failed to write temporary execution file.");
  }

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [tempFilePath], { timeout: 15000 });

    let outputData = "";
    pythonProcess.stdout.on("data", (data) => {
      outputData += data.toString();
    });

    let errorData = "";
    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pythonProcess.on("close", async (exitCode) => {
      // Immediately delete the temporary file
      await fs.unlink(tempFilePath).catch(console.error);

      if (exitCode !== 0) {
        return reject(errorData || "Process exited with code " + exitCode);
      }

      try {
        const results = JSON.parse(outputData);
        const allPassed = results.every((res) => res.passed);
        resolve({ success: allPassed, details: results });
      } catch (err) {
        reject(
          "Failed to parse sandbox output. Output received: " + outputData,
        );
      }
    });
  });
};

module.exports = { runPythonCode };
