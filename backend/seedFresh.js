require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Topic = require("./models/Topic");
const Subtopic = require("./models/Subtopic");
const Question = require("./models/Question");
const Attempt = require("./models/Attempt");
const UserSubtopicStats = require("./models/UserSubtopicStats");
const RecoveryPlan = require("./models/RecoveryPlan");

const seedFresh = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // ---------------------------------------------------------
    // 1. WIPE ALL 7 COLLECTIONS CLEAN
    // ---------------------------------------------------------
    await Promise.all([
      User.deleteMany({}),
      Topic.deleteMany({}),
      Subtopic.deleteMany({}),
      Question.deleteMany({}),
      Attempt.deleteMany({}),
      UserSubtopicStats.deleteMany({}),
      RecoveryPlan.deleteMany({}),
    ]);
    console.log("Wiped all 7 collections.");

    // ---------------------------------------------------------
    // 2. SEED USERS (Admin + Fresh Student + Demo Student)
    // ---------------------------------------------------------
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("Admin@123", salt);
    const studentPassword = await bcrypt.hash("Student@123", salt);

    const [adminUser, freshStudent, demoStudent] = await User.insertMany([
      {
        name: "System Admin",
        email: "admin@interviewvault.com",
        password: adminPassword,
        role: "Admin",
        isActive: true,
      },
      {
        name: "Ayesha Khan",
        email: "student@interviewvault.com",
        password: studentPassword,
        role: "Student",
        isActive: true,
      },
      {
        name: "Bilal Ahmed",
        email: "demo@interviewvault.com",
        password: studentPassword,
        role: "Student",
        isActive: true,
      },
    ]);
    console.log("Seeded 3 users (1 Admin, 2 Students).");

    // ---------------------------------------------------------
    // 3. SEED 4 CORE TOPICS
    // ---------------------------------------------------------
    const topics = await Topic.insertMany([
      { name: "DSA" },
      { name: "OOP" },
      { name: "DBMS" },
      { name: "OS" },
    ]);
    const T = Object.fromEntries(topics.map((t) => [t.name, t._id]));
    console.log("Seeded 4 topics.");

    // ---------------------------------------------------------
    // 4. SEED 16 SUBTOPICS (4 PER TOPIC)
    // ---------------------------------------------------------
    const subtopicDefs = [
      // DSA
      { topicID: T.DSA, name: "Recursion" },
      { topicID: T.DSA, name: "Arrays & Strings" },
      { topicID: T.DSA, name: "Two Pointers" },
      { topicID: T.DSA, name: "Dynamic Programming" },
      // OOP
      { topicID: T.OOP, name: "Polymorphism" },
      { topicID: T.OOP, name: "Encapsulation" },
      { topicID: T.OOP, name: "Inheritance" },
      { topicID: T.OOP, name: "Design Patterns" },
      // DBMS
      { topicID: T.DBMS, name: "Joins" },
      { topicID: T.DBMS, name: "Normalization" },
      { topicID: T.DBMS, name: "Indexing" },
      { topicID: T.DBMS, name: "Transactions & ACID" },
      // OS
      { topicID: T.OS, name: "Concurrency" },
      { topicID: T.OS, name: "Deadlocks" },
      { topicID: T.OS, name: "Memory Management" },
      { topicID: T.OS, name: "CPU Scheduling" },
    ];

    const subtopics = await Subtopic.insertMany(subtopicDefs);
    const S = Object.fromEntries(subtopics.map((s) => [s.name, s._id]));
    console.log("Seeded 16 subtopics.");

    // ---------------------------------------------------------
    // 5. SEED 24 CURATED QUESTIONS (CODING + THEORY)
    // ---------------------------------------------------------
    const questionsData = [
      // ===================== DSA (8 Questions) =====================
      {
        statement:
          "Write a Python function `factorial(n)` that returns the factorial of a non-negative integer `n` using recursion.",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(factorial(0))",
            expectedOutput: "1",
            isHidden: false,
          },
          {
            input: "print(factorial(5))",
            expectedOutput: "120",
            isHidden: false,
          },
          {
            input: "print(factorial(7))",
            expectedOutput: "5040",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `sum_digits(n)` that recursively returns the sum of digits of a non-negative integer `n`.",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(sum_digits(1234))",
            expectedOutput: "10",
            isHidden: false,
          },
          {
            input: "print(sum_digits(0))",
            expectedOutput: "0",
            isHidden: false,
          },
          {
            input: "print(sum_digits(999))",
            expectedOutput: "27",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `fib(n)` that returns the nth Fibonacci number (0-indexed: fib(0)=0, fib(1)=1).",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"], S["Dynamic Programming"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          { input: "print(fib(5))", expectedOutput: "5", isHidden: false },
          { input: "print(fib(10))", expectedOutput: "55", isHidden: false },
          { input: "print(fib(15))", expectedOutput: "610", isHidden: true },
        ],
      },
      {
        statement:
          "Write a Python function `power(base, exp)` that computes `base` raised to `exp` (non-negative integer) using divide-and-conquer recursion.",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(power(2, 10))",
            expectedOutput: "1024",
            isHidden: false,
          },
          { input: "print(power(5, 0))", expectedOutput: "1", isHidden: false },
          { input: "print(power(3, 4))", expectedOutput: "81", isHidden: true },
        ],
      },
      {
        statement:
          "Write a Python function `is_palindrome(s)` that returns `True` if string `s` (lowercase letters only) is a palindrome, else `False`, using two pointers.",
        topicID: T.DSA,
        subtopicIDs: [S["Arrays & Strings"], S["Two Pointers"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(is_palindrome('racecar'))",
            expectedOutput: "True",
            isHidden: false,
          },
          {
            input: "print(is_palindrome('hello'))",
            expectedOutput: "False",
            isHidden: false,
          },
          {
            input: "print(is_palindrome('a'))",
            expectedOutput: "True",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `two_sum_sorted(nums, target)` that takes a sorted list of integers and returns a list of 0-based indices `[i, j]` of the two numbers that add up to `target`.",
        topicID: T.DSA,
        subtopicIDs: [S["Arrays & Strings"], S["Two Pointers"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(two_sum_sorted([2, 7, 11, 15], 9))",
            expectedOutput: "[0, 1]",
            isHidden: false,
          },
          {
            input: "print(two_sum_sorted([1, 2, 3, 4, 6], 6))",
            expectedOutput: "[1, 3]",
            isHidden: false,
          },
          {
            input: "print(two_sum_sorted([-3, 0, 4, 9], 6))",
            expectedOutput: "[0, 3]",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `climb_stairs(n)` that returns the number of distinct ways to climb `n` stairs if you can take 1 or 2 steps at a time.",
        topicID: T.DSA,
        subtopicIDs: [S["Dynamic Programming"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(climb_stairs(3))",
            expectedOutput: "3",
            isHidden: false,
          },
          {
            input: "print(climb_stairs(5))",
            expectedOutput: "8",
            isHidden: false,
          },
          {
            input: "print(climb_stairs(10))",
            expectedOutput: "89",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `lis_length(nums)` that returns the length of the longest strictly increasing subsequence in a list of integers.",
        topicID: T.DSA,
        subtopicIDs: [S["Dynamic Programming"], S["Arrays & Strings"]],
        difficulty: "Hard",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(lis_length([10, 9, 2, 5, 3, 7, 101, 18]))",
            expectedOutput: "4",
            isHidden: false,
          },
          {
            input: "print(lis_length([0, 1, 0, 3, 2, 3]))",
            expectedOutput: "4",
            isHidden: false,
          },
          {
            input: "print(lis_length([7, 7, 7, 7]))",
            expectedOutput: "1",
            isHidden: true,
          },
        ],
      },

      // ===================== OOP (5 Questions) =====================
      {
        statement:
          "Explain the difference between compile-time polymorphism (method overloading) and run-time polymorphism (method overriding).",
        topicID: T.OOP,
        subtopicIDs: [S["Polymorphism"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Compile-time polymorphism resolves which method to call at compile time (e.g., method overloading with different parameter lists). Run-time polymorphism resolves the method dynamically at runtime via inheritance and virtual dispatch (method overriding in a subclass).",
      },
      {
        statement:
          "How does encapsulation improve maintainability, and how does it differ from abstraction?",
        topicID: T.OOP,
        subtopicIDs: [S["Encapsulation"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Encapsulation bundles data and methods together and restricts direct access to internal state using access modifiers, protecting invariants. Abstraction hides implementation complexity by exposing only essential interfaces. Encapsulation is the mechanism; abstraction is the design-level view.",
      },
      {
        statement:
          "What is the Diamond Problem in multiple inheritance, and how do languages like C++ or Python resolve it?",
        topicID: T.OOP,
        subtopicIDs: [S["Inheritance"], S["Polymorphism"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "The Diamond Problem occurs when class D inherits from B and C, both of which inherit from A, creating ambiguity over which copy of A's members D inherits. C++ solves it with virtual inheritance; Python solves it deterministically using C3 Linearization (Method Resolution Order / MRO).",
      },
      {
        statement:
          "Compare the Factory Method pattern and the Strategy pattern. Give a concrete use case for each.",
        topicID: T.OOP,
        subtopicIDs: [S["Design Patterns"], S["Polymorphism"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Factory Method is a creational pattern that delegates object instantiation to subclasses (e.g., creating OS-specific UI buttons). Strategy is a behavioral pattern that encapsulates interchangeable algorithms behind a common interface so behavior can be swapped at runtime (e.g., switching payment or sorting algorithms).",
      },
      {
        statement:
          "Explain why composition is generally preferred over inheritance, and describe a scenario where inheritance violates the Liskov Substitution Principle (LSP).",
        topicID: T.OOP,
        subtopicIDs: [S["Inheritance"], S["Design Patterns"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Composition avoids tight coupling and fragile base-class hierarchies by assembling behaviors dynamically. A classic LSP violation is making Square inherit from Rectangle: overriding setWidth() to also change height breaks callers expecting Rectangle's width and height to vary independently.",
      },

      // ===================== DBMS (6 Questions) =====================
      {
        statement:
          "Explain the difference between an INNER JOIN, LEFT OUTER JOIN, and FULL OUTER JOIN.",
        topicID: T.DBMS,
        subtopicIDs: [S["Joins"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "INNER JOIN returns only rows with matching keys in both tables. LEFT OUTER JOIN returns all rows from the left table and matched rows from the right (NULL if unmatched). FULL OUTER JOIN returns all rows from both tables, filling unmatched sides with NULL.",
      },
      {
        statement:
          "What is a Self Join, and when would you use one in a relational database?",
        topicID: T.DBMS,
        subtopicIDs: [S["Joins"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A Self Join joins a table to itself using table aliases. It is commonly used to query hierarchical or relational data stored in the same table, such as matching employees to their managers via an employee.manager_id foreign key.",
      },
      {
        statement:
          "How does a CROSS JOIN differ from a NATURAL JOIN, and why are NATURAL JOINs discouraged in production SQL?",
        topicID: T.DBMS,
        subtopicIDs: [S["Joins"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "CROSS JOIN produces the Cartesian product of both tables. NATURAL JOIN automatically joins on all columns sharing the same name. NATURAL JOINs are discouraged because adding a new identically named column (like updated_at) to both tables silently changes query results.",
      },
      {
        statement:
          "Explain 1NF, 2NF, 3NF, and BCNF. What anomaly does 3NF eliminate?",
        topicID: T.DBMS,
        subtopicIDs: [S["Normalization"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "1NF enforces atomic values; 2NF removes partial dependencies on composite primary keys; 3NF removes transitive dependencies where a non-key attribute depends on another non-key attribute; BCNF requires every determinant to be a candidate key. 3NF eliminates update, insertion, and deletion anomalies caused by transitive dependencies.",
      },
      {
        statement:
          "Why do relational databases predominantly use B+ Trees rather than Hash Tables for general-purpose indexes?",
        topicID: T.DBMS,
        subtopicIDs: [S["Indexing"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "B+ Trees keep keys sorted and link leaf nodes sequentially, supporting efficient range queries (BETWEEN, <, >), prefix matching, and ORDER BY in O(log n) with minimal disk I/O. Hash indexes only support O(1) exact equality lookups and cannot handle range scans.",
      },
      {
        statement:
          "Explain the four SQL transaction isolation levels and which concurrency anomalies (dirty read, non-repeatable read, phantom read) each prevents.",
        topicID: T.DBMS,
        subtopicIDs: [S["Transactions & ACID"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Read Uncommitted prevents none; Read Committed prevents dirty reads; Repeatable Read prevents dirty and non-repeatable reads; Serializable prevents dirty, non-repeatable, and phantom reads by ensuring execution is equivalent to a serial schedule.",
      },

      // ===================== OS (5 Questions) =====================
      {
        statement:
          "What is the difference between a process and a thread? What resources do threads within the same process share?",
        topicID: T.OS,
        subtopicIDs: [S["Concurrency"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A process is an independent execution unit with its own isolated address space. Threads are lightweight execution units inside a process. Threads share code, heap, global data, and open file descriptors, while each thread keeps its own stack, registers, and program counter.",
      },
      {
        statement:
          "Explain the difference between a Mutex and a Counting Semaphore.",
        topicID: T.OS,
        subtopicIDs: [S["Concurrency"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A Mutex is a binary locking mechanism with ownership—only the thread that acquires the lock can release it, protecting critical sections. A Counting Semaphore is a signaling mechanism with an integer counter allowing up to N concurrent accesses and can be signaled by a different thread.",
      },
      {
        statement:
          "List the four Coffman conditions necessary for a deadlock to occur, and explain one strategy to prevent deadlocks.",
        topicID: T.OS,
        subtopicIDs: [S["Deadlocks"], S["Concurrency"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one prevents deadlocks—for example, enforcing a strict global lock acquisition ordering eliminates Circular Wait.",
      },
      {
        statement:
          "How does virtual memory with paging work, and what is the role of the TLB (Translation Lookaside Buffer)?",
        topicID: T.OS,
        subtopicIDs: [S["Memory Management"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Paging divides virtual memory into fixed-size pages mapped to physical frames via page tables, enabling non-contiguous allocation and isolation. The TLB is a fast hardware cache storing recent virtual-to-physical page translations to avoid slow multi-level page-table walks on every memory access.",
      },
      {
        statement:
          "Compare Round Robin, Shortest Remaining Time First (SRTF), and Multi-Level Feedback Queue (MLFQ) scheduling in terms of response time, starvation, and throughput.",
        topicID: T.OS,
        subtopicIDs: [S["CPU Scheduling"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Round Robin guarantees fairness and good response time with no starvation but suffers higher context-switch overhead if the quantum is too small. SRTF minimizes average waiting time (optimal throughput) but can starve long jobs. MLFQ dynamically adjusts priorities across queues to balance interactive response time and throughput, using priority boost (aging) to prevent starvation.",
      },
    ];

    const questions = await Question.insertMany(questionsData);
    console.log(`Seeded ${questions.length} curated questions.`);

    // Helper to locate seeded questions by keyword
    const findQ = (keyword) =>
      questions.find((q) => q.statement.includes(keyword));

    // ---------------------------------------------------------
    // 6. SEED REALISTIC HISTORY FOR demo@interviewvault.com
    //    (Triggers RootCause = Recursion, Review = Joins, Stretch = Hard)
    // ---------------------------------------------------------
    const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

    const qJoin1 = findQ("INNER JOIN");
    const qJoin2 = findQ("Self Join");
    const qJoin3 = findQ("CROSS JOIN");
    const qRec1 = findQ("fib(n)");
    const qRec2 = findQ("power(base, exp)");
    const qPoly = findQ("compile-time polymorphism");
    const qConc = findQ("process and a thread");

    await Attempt.insertMany([
      // 3 Solved in Joins 9 days ago -> Qualifies Joins for the Review slot!
      {
        userID: demoStudent._id,
        questionID: qJoin1._id,
        status: "Solved",
        submittedCodeOrText:
          "Inner join matches both; left join keeps all left rows.",
        timeTakenSeconds: 95,
        createdAt: daysAgo(9),
      },
      {
        userID: demoStudent._id,
        questionID: qJoin2._id,
        status: "Solved",
        submittedCodeOrText:
          "Joins a table to itself using aliases, e.g., employee-manager.",
        timeTakenSeconds: 70,
        createdAt: daysAgo(9),
      },
      {
        userID: demoStudent._id,
        questionID: qJoin3._id,
        status: "Solved",
        submittedCodeOrText:
          "Cross join is Cartesian product; natural join matches same-name columns.",
        timeTakenSeconds: 110,
        createdAt: daysAgo(9),
      },
      // 1 Solved in Polymorphism (OOP) 3 days ago
      {
        userID: demoStudent._id,
        questionID: qPoly._id,
        status: "Solved",
        submittedCodeOrText:
          "Overloading is compile-time; overriding is runtime dispatch.",
        timeTakenSeconds: 85,
        createdAt: daysAgo(3),
      },
      // 1 Attempted in Concurrency (OS) 2 days ago
      {
        userID: demoStudent._id,
        questionID: qConc._id,
        status: "Attempted",
        submittedCodeOrText:
          "Processes have separate memory, threads share heap.",
        timeTakenSeconds: 120,
        createdAt: daysAgo(2),
      },
      // 2 Missed in Recursion (DSA) recently -> Triggers RootCause = Recursion!
      {
        userID: demoStudent._id,
        questionID: qRec1._id,
        status: "Attempted",
        submittedCodeOrText: "def fib(n):\n    return fib(n-1) + fib(n-2)",
        timeTakenSeconds: 240,
        createdAt: hoursAgo(26),
      },
      {
        userID: demoStudent._id,
        questionID: qRec2._id,
        status: "Skipped",
        submittedCodeOrText: "",
        timeTakenSeconds: 30,
        createdAt: hoursAgo(3),
      },
    ]);

    // Matching pre-aggregated UserSubtopicStats for demoStudent
    await UserSubtopicStats.insertMany([
      {
        userID: demoStudent._id,
        subtopicID: S["Joins"],
        solved: 3,
        attempted: 0,
        skipped: 0,
        lastPracticed: daysAgo(9),
      },
      {
        userID: demoStudent._id,
        subtopicID: S["Polymorphism"],
        solved: 1,
        attempted: 0,
        skipped: 0,
        lastPracticed: daysAgo(3),
      },
      {
        userID: demoStudent._id,
        subtopicID: S["Concurrency"],
        solved: 0,
        attempted: 1,
        skipped: 0,
        lastPracticed: daysAgo(2),
      },
      {
        userID: demoStudent._id,
        subtopicID: S["Recursion"],
        solved: 0,
        attempted: 1,
        skipped: 1,
        lastPracticed: hoursAgo(3),
      },
      {
        userID: demoStudent._id,
        subtopicID: S["Dynamic Programming"],
        solved: 0,
        attempted: 1,
        skipped: 0,
        lastPracticed: hoursAgo(26),
      },
    ]);
    console.log("Seeded demo attempt history and subtopic stats.");

    console.log("\n========================================================");
    console.log("DATABASE RESET & SEEDED SUCCESSFULLY!");
    console.log("========================================================");
    console.log("Admin Login:         admin@interviewvault.com   / Admin@123");
    console.log(
      "Fresh Student Login: student@interviewvault.com / Student@123",
    );
    console.log(
      "Demo Student Login:  demo@interviewvault.com    / Student@123",
    );
    console.log("========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error resetting and seeding database:", error);
    process.exit(1);
  }
};

seedFresh();
