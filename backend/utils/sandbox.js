const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

/**
 * Runs Python code against a set of test cases in an isolated child process.
 * Writes to a temporary file to avoid OS command-line string limits.
 */
const runPythonCode = async (code, testCases) => {
  return new Promise(async (resolve, reject) => {
    const wrapperScript = `
import sys
import json
import time

# Map JavaScript JSON booleans/null to Python equivalents
true = True
false = False
null = None

# User Code
${code}

test_cases = ${JSON.stringify(testCases)}
results = []

for tc in test_cases:
    start_time = time.time()
    try:
        from io import StringIO
        old_stdout = sys.stdout
        redirected_output = sys.stdout = StringIO()
        
        exec(tc["input"]) 
        
        sys.stdout = old_stdout
        actual_output = redirected_output.getvalue().strip()
        
        passed = str(actual_output) == str(tc["expectedOutput"])
        results.append({"passed": passed, "actual": actual_output, "expected": tc["expectedOutput"]})
        
    except Exception as e:
        results.append({"passed": False, "error": str(e)})

print(json.dumps(results))
`;

    // 1. Create a unique temporary file path
    const tempFileName = `temp_exec_${crypto.randomUUID()}.py`;
    const tempFilePath = path.join(__dirname, tempFileName);

    try {
      // 2. Write the wrapper script to the disk
      await fs.writeFile(tempFilePath, wrapperScript);

      // 3. Spawn the Python process targeting the file (15-second timeout)
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
        // 4. Immediately delete the temporary file
        await fs.unlink(tempFilePath).catch(console.error);

        if (exitCode !== 0)
          return reject(errorData || "Process exited with code " + exitCode);

        try {
          const results = JSON.parse(outputData);
          const allPassed = results.every((res) => res.passed);
          resolve({ success: allPassed, details: results });
        } catch (err) {
          reject("Failed to parse sandbox output.");
        }
      });
    } catch (err) {
      reject("Failed to write temporary execution file.");
    }
  });
};

module.exports = { runPythonCode };
