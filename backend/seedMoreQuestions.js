require("dotenv").config();
const mongoose = require("mongoose");

const Topic = require("./models/Topic");
const Subtopic = require("./models/Subtopic");
const Question = require("./models/Question");

const seedMoreQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // 1. Load existing Topics & Subtopics seeded by seedFresh.js
    const topics = await Topic.find();
    const subtopics = await Subtopic.find();

    const T = Object.fromEntries(topics.map((t) => [t.name, t._id]));
    const S = Object.fromEntries(subtopics.map((s) => [s.name, s._id]));

    const requiredTopics = ["DSA", "OOP", "DBMS", "OS"];
    const requiredSubtopics = [
      "Recursion",
      "Arrays & Strings",
      "Two Pointers",
      "Dynamic Programming",
      "Polymorphism",
      "Encapsulation",
      "Inheritance",
      "Design Patterns",
      "Joins",
      "Normalization",
      "Indexing",
      "Transactions & ACID",
      "Concurrency",
      "Deadlocks",
      "Memory Management",
      "CPU Scheduling",
    ];

    const missingTopics = requiredTopics.filter((name) => !T[name]);
    const missingSubtopics = requiredSubtopics.filter((name) => !S[name]);

    if (missingTopics.length || missingSubtopics.length) {
      throw new Error(
        `Missing base taxonomy. Run seedFresh.js first. Missing topics: [${missingTopics.join(", ")}], Missing subtopics: [${missingSubtopics.join(", ")}]`,
      );
    }

    // 2. Define 50 new questions (14 DSA, 12 OOP, 12 DBMS, 12 OS)
    const newQuestions = [
      // =========================================================
      // DSA (14 Coding Questions)
      // =========================================================
      // --- Recursion (3) ---
      {
        statement:
          "Write a Python function `reverse_string(s)` that returns the reversed version of string `s` using recursion.",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"], S["Arrays & Strings"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(reverse_string('hello'))",
            expectedOutput: "olleh",
            isHidden: false,
          },
          {
            input: "print(reverse_string('a'))",
            expectedOutput: "a",
            isHidden: false,
          },
          {
            input: "print(reverse_string('python'))",
            expectedOutput: "nohtyp",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `gcd(a, b)` that returns the greatest common divisor of two positive integers using Euclid's recursive algorithm.",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          { input: "print(gcd(48, 18))", expectedOutput: "6", isHidden: false },
          { input: "print(gcd(17, 13))", expectedOutput: "1", isHidden: false },
          {
            input: "print(gcd(100, 25))",
            expectedOutput: "25",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `count_paths(m, n)` that returns the number of unique paths from the top-left corner to the bottom-right corner of an `m x n` grid moving only right or down.",
        topicID: T.DSA,
        subtopicIDs: [S["Recursion"], S["Dynamic Programming"]],
        difficulty: "Hard",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(count_paths(3, 3))",
            expectedOutput: "6",
            isHidden: false,
          },
          {
            input: "print(count_paths(3, 2))",
            expectedOutput: "3",
            isHidden: false,
          },
          {
            input: "print(count_paths(3, 7))",
            expectedOutput: "28",
            isHidden: true,
          },
        ],
      },

      // --- Arrays & Strings (4) ---
      {
        statement:
          "Write a Python function `find_missing(nums)` that takes a list of `n` distinct integers in the range `[0, n]` and returns the single missing number.",
        topicID: T.DSA,
        subtopicIDs: [S["Arrays & Strings"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(find_missing([3, 0, 1]))",
            expectedOutput: "2",
            isHidden: false,
          },
          {
            input: "print(find_missing([0, 1]))",
            expectedOutput: "2",
            isHidden: false,
          },
          {
            input: "print(find_missing([9, 6, 4, 2, 3, 5, 7, 0, 1]))",
            expectedOutput: "8",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `max_subarray_sum(nums)` that returns the maximum sum of any contiguous non-empty subarray of `nums`.",
        topicID: T.DSA,
        subtopicIDs: [S["Arrays & Strings"], S["Dynamic Programming"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(max_subarray_sum([-2, 1, -3, 4, -1, 2, 1, -5, 4]))",
            expectedOutput: "6",
            isHidden: false,
          },
          {
            input: "print(max_subarray_sum([1]))",
            expectedOutput: "1",
            isHidden: false,
          },
          {
            input: "print(max_subarray_sum([5, 4, -1, 7, 8]))",
            expectedOutput: "23",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `longest_unique_substring(s)` that returns the length of the longest substring of `s` without repeating characters.",
        topicID: T.DSA,
        subtopicIDs: [S["Arrays & Strings"], S["Two Pointers"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(longest_unique_substring('abcabcbb'))",
            expectedOutput: "3",
            isHidden: false,
          },
          {
            input: "print(longest_unique_substring('bbbbb'))",
            expectedOutput: "1",
            isHidden: false,
          },
          {
            input: "print(longest_unique_substring('pwwkew'))",
            expectedOutput: "3",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `first_missing_positive(nums)` that returns the smallest missing positive integer from an unsorted list of integers.",
        topicID: T.DSA,
        subtopicIDs: [S["Arrays & Strings"]],
        difficulty: "Hard",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(first_missing_positive([1, 2, 0]))",
            expectedOutput: "3",
            isHidden: false,
          },
          {
            input: "print(first_missing_positive([3, 4, -1, 1]))",
            expectedOutput: "2",
            isHidden: false,
          },
          {
            input: "print(first_missing_positive([7, 8, 9, 11, 12]))",
            expectedOutput: "1",
            isHidden: true,
          },
        ],
      },

      // --- Two Pointers (3) ---
      {
        statement:
          "Write a Python function `remove_duplicates_count(nums)` that takes a sorted list of integers and returns the number of unique elements using two pointers.",
        topicID: T.DSA,
        subtopicIDs: [S["Two Pointers"], S["Arrays & Strings"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(remove_duplicates_count([1, 1, 2]))",
            expectedOutput: "2",
            isHidden: false,
          },
          {
            input:
              "print(remove_duplicates_count([0, 0, 1, 1, 1, 2, 2, 3, 3, 4]))",
            expectedOutput: "5",
            isHidden: false,
          },
          {
            input: "print(remove_duplicates_count([5]))",
            expectedOutput: "1",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `max_water_area(heights)` that returns the maximum area of water a container formed by two vertical lines in `heights` can hold.",
        topicID: T.DSA,
        subtopicIDs: [S["Two Pointers"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(max_water_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))",
            expectedOutput: "49",
            isHidden: false,
          },
          {
            input: "print(max_water_area([1, 1]))",
            expectedOutput: "1",
            isHidden: false,
          },
          {
            input: "print(max_water_area([4, 3, 2, 1, 4]))",
            expectedOutput: "16",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `trap_rain_water(heights)` that computes how much rainwater can be trapped between bars of non-negative elevation heights.",
        topicID: T.DSA,
        subtopicIDs: [S["Two Pointers"], S["Arrays & Strings"]],
        difficulty: "Hard",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input:
              "print(trap_rain_water([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))",
            expectedOutput: "6",
            isHidden: false,
          },
          {
            input: "print(trap_rain_water([4, 2, 0, 3, 2, 5]))",
            expectedOutput: "9",
            isHidden: false,
          },
          {
            input: "print(trap_rain_water([1, 2, 3]))",
            expectedOutput: "0",
            isHidden: true,
          },
        ],
      },

      // --- Dynamic Programming (4) ---
      {
        statement:
          "Write a Python function `min_cost_stairs(cost)` where `cost[i]` is the cost of step `i`. You may start at index 0 or 1 and climb 1 or 2 steps; return the minimum cost to reach the top.",
        topicID: T.DSA,
        subtopicIDs: [S["Dynamic Programming"]],
        difficulty: "Easy",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(min_cost_stairs([10, 15, 20]))",
            expectedOutput: "15",
            isHidden: false,
          },
          {
            input:
              "print(min_cost_stairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]))",
            expectedOutput: "6",
            isHidden: false,
          },
          {
            input: "print(min_cost_stairs([0, 0, 0, 1]))",
            expectedOutput: "0",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `house_robber(nums)` that returns the maximum sum of non-adjacent non-negative integers in `nums`.",
        topicID: T.DSA,
        subtopicIDs: [S["Dynamic Programming"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(house_robber([1, 2, 3, 1]))",
            expectedOutput: "4",
            isHidden: false,
          },
          {
            input: "print(house_robber([2, 7, 9, 3, 1]))",
            expectedOutput: "12",
            isHidden: false,
          },
          {
            input: "print(house_robber([5]))",
            expectedOutput: "5",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `coin_change(coins, amount)` that returns the fewest number of coins needed to make `amount`, or `-1` if it cannot be formed.",
        topicID: T.DSA,
        subtopicIDs: [S["Dynamic Programming"]],
        difficulty: "Medium",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(coin_change([1, 2, 5], 11))",
            expectedOutput: "3",
            isHidden: false,
          },
          {
            input: "print(coin_change([2], 3))",
            expectedOutput: "-1",
            isHidden: false,
          },
          {
            input: "print(coin_change([1], 0))",
            expectedOutput: "0",
            isHidden: true,
          },
        ],
      },
      {
        statement:
          "Write a Python function `edit_distance(w1, w2)` that returns the minimum number of single-character insertions, deletions, or replacements required to convert `w1` into `w2`.",
        topicID: T.DSA,
        subtopicIDs: [S["Dynamic Programming"], S["Arrays & Strings"]],
        difficulty: "Hard",
        type: "Coding",
        isArchived: false,
        testCases: [
          {
            input: "print(edit_distance('horse', 'ros'))",
            expectedOutput: "3",
            isHidden: false,
          },
          {
            input: "print(edit_distance('intention', 'execution'))",
            expectedOutput: "5",
            isHidden: false,
          },
          {
            input: "print(edit_distance('abc', 'abc'))",
            expectedOutput: "0",
            isHidden: true,
          },
        ],
      },

      // =========================================================
      // OOP (12 Theory Questions)
      // =========================================================
      // --- Polymorphism (3) ---
      {
        statement:
          "What is operator overloading, and how is it an example of polymorphism?",
        topicID: T.OOP,
        subtopicIDs: [S["Polymorphism"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Operator overloading lets user-defined types define custom behavior for built-in operators like `+` or `==`. It is ad-hoc polymorphism because the same operator symbol behaves differently depending on the operand types.",
      },
      {
        statement:
          "How do virtual method tables (vtables) enable dynamic dispatch in object-oriented languages like C++?",
        topicID: T.OOP,
        subtopicIDs: [S["Polymorphism"], S["Inheritance"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Each class with virtual methods has a vtable storing function pointers to its method implementations. Every object stores a hidden vptr pointing to its runtime class's vtable, allowing virtual calls to resolve to the derived override at runtime.",
      },
      {
        statement:
          "Explain covariance and contravariance in polymorphic type systems, and give an example involving return types and parameter types.",
        topicID: T.OOP,
        subtopicIDs: [S["Polymorphism"], S["Inheritance"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Covariance preserves subtype ordering (e.g., an overriding method can return a more specific subtype than the base method). Contravariance reverses subtype ordering (e.g., a function accepting a broader base parameter type can safely substitute for one expecting a narrower subtype).",
      },

      // --- Encapsulation (3) ---
      {
        statement:
          "Compare `public`, `protected`, and `private` access modifiers in object-oriented programming.",
        topicID: T.OOP,
        subtopicIDs: [S["Encapsulation"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "`public` members are accessible from anywhere; `protected` members are accessible within the class and its subclasses; `private` members are accessible only within the defining class itself.",
      },
      {
        statement:
          "Why is blindly adding getters and setters for every private field considered poor encapsulation?",
        topicID: T.OOP,
        subtopicIDs: [S["Encapsulation"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Exposing unrestricted getters and setters effectively makes internal state public, leaking implementation details and allowing callers to break class invariants. Good encapsulation exposes behavior-driven methods that validate and protect state transitions.",
      },
      {
        statement:
          "Explain the Law of Demeter (Principle of Least Knowledge) and how violating it breaks encapsulation.",
        topicID: T.OOP,
        subtopicIDs: [S["Encapsulation"], S["Design Patterns"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "The Law of Demeter states that an object should only call methods on itself, its parameters, objects it creates, or its direct fields—avoiding chains like `a.getB().getC().doWork()`. Chaining couples callers to internal object graphs, making refactoring brittle.",
      },

      // --- Inheritance (3) ---
      {
        statement:
          "What is the difference between an abstract class and an interface?",
        topicID: T.OOP,
        subtopicIDs: [S["Inheritance"], S["Polymorphism"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "An abstract class can hold state (fields), constructors, and both concrete and abstract methods, and typically supports single inheritance. An interface defines a contract of methods without instance state, and a class can implement multiple interfaces.",
      },
      {
        statement:
          "What is the fragile base class problem, and how does it arise in deep inheritance hierarchies?",
        topicID: T.OOP,
        subtopicIDs: [S["Inheritance"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "The fragile base class problem occurs when seemingly safe internal changes to a superclass unintentionally break subclasses that rely on its internal call order or overridden hooks. Deep hierarchies amplify this hidden coupling.",
      },
      {
        statement:
          "What are mixins and traits, and how do they solve code reuse without the pitfalls of classical multiple inheritance?",
        topicID: T.OOP,
        subtopicIDs: [S["Inheritance"], S["Design Patterns"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Mixins and traits are small, focused units of reusable behavior composed into classes without forming deep 'is-a' hierarchies. Traits explicitly resolve method name conflicts at composition time and avoid stateful diamond inheritance ambiguities.",
      },

      // --- Design Patterns (3) ---
      {
        statement:
          "What is the Singleton pattern, when is it appropriate, and what is one major drawback for unit testing?",
        topicID: T.OOP,
        subtopicIDs: [S["Design Patterns"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Singleton restricts a class to a single shared instance with global access (e.g., a logger or configuration registry). Its main testing drawback is shared mutable global state, which makes tests order-dependent and hard to mock without dependency injection.",
      },
      {
        statement:
          "Explain the Observer pattern and how it decouples event producers from consumers.",
        topicID: T.OOP,
        subtopicIDs: [S["Design Patterns"], S["Encapsulation"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "In the Observer pattern, a Subject maintains a list of Observer subscribers and notifies them automatically whenever its state changes. The Subject only knows the Observer interface, allowing new listeners to be added or removed without modifying the Subject.",
      },
      {
        statement:
          "Compare the Decorator, Adapter, and Proxy structural design patterns by intent.",
        topicID: T.OOP,
        subtopicIDs: [S["Design Patterns"], S["Polymorphism"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Adapter converts an incompatible interface into the interface a client expects. Decorator wraps an object with the same interface to dynamically add layered responsibilities. Proxy provides a stand-in with the same interface to control access (e.g., lazy loading, caching, or authorization).",
      },

      // =========================================================
      // DBMS (12 Theory Questions)
      // =========================================================
      // --- Joins (3) ---
      {
        statement:
          "What is the difference between placing a filter condition in the `ON` clause versus the `WHERE` clause of a `LEFT OUTER JOIN`?",
        topicID: T.DBMS,
        subtopicIDs: [S["Joins"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A condition in the `ON` clause filters rows from the right table before joining, preserving unmatched left-table rows with NULLs. Placing a right-table filter in the `WHERE` clause runs after the join and discards NULL-padded rows, effectively turning it into an INNER JOIN.",
      },
      {
        statement:
          "Explain what a semi-join (`EXISTS` / `IN`) and an anti-join (`NOT EXISTS` / `LEFT JOIN ... IS NULL`) do, and why `NOT IN` can fail with NULLs.",
        topicID: T.DBMS,
        subtopicIDs: [S["Joins"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A semi-join returns rows from the left table that have at least one match in the right table without duplicating rows. An anti-join returns unmatched left rows. `NOT IN` fails if the subquery contains any NULL because `x != NULL` evaluates to UNKNOWN, causing the entire predicate to return no rows.",
      },
      {
        statement:
          "Compare Nested Loop Join, Hash Join, and Sort-Merge Join. When does a query optimizer prefer each?",
        topicID: T.DBMS,
        subtopicIDs: [S["Joins"], S["Indexing"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Nested Loop Join excels when the outer input is small and the inner table has an index on the join key. Hash Join is fastest for large unsorted equi-joins that fit in memory. Sort-Merge Join is preferred when inputs are already sorted or when range/inequality joins are needed.",
      },

      // --- Normalization (3) ---
      {
        statement:
          "What are insertion, update, and deletion anomalies in an unnormalized database table?",
        topicID: T.DBMS,
        subtopicIDs: [S["Normalization"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "An insertion anomaly prevents adding data because unrelated attributes are missing; an update anomaly requires changing duplicated facts in multiple rows (risking inconsistency); a deletion anomaly accidentally loses unrelated data when deleting a row.",
      },
      {
        statement:
          "What is the difference between a candidate key, a primary key, a superkey, and a surrogate key?",
        topicID: T.DBMS,
        subtopicIDs: [S["Normalization"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A superkey is any attribute set that uniquely identifies a row; a candidate key is a minimal superkey; the primary key is the chosen candidate key; a surrogate key is an artificial system-generated identifier (e.g., auto-increment ID or UUID) with no business meaning.",
      },
      {
        statement:
          "When is deliberate denormalization justified in a production database, and what trade-offs does it introduce?",
        topicID: T.DBMS,
        subtopicIDs: [S["Normalization"], S["Indexing"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Denormalization is justified in read-heavy workloads where expensive multi-table joins bottleneck latency (e.g., analytics or pre-aggregated counters). The trade-offs are extra storage, slower and more complex writes, and the risk of data inconsistency if duplicated fields drift out of sync.",
      },

      // --- Indexing (3) ---
      {
        statement:
          "What is the difference between a clustered index and a non-clustered (secondary) index?",
        topicID: T.DBMS,
        subtopicIDs: [S["Indexing"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A clustered index determines the physical storage order of the table's rows (so a table can have only one). A non-clustered index is a separate structure storing index keys alongside pointers (or primary keys) to the actual table rows.",
      },
      {
        statement:
          "Explain the leftmost prefix rule for composite (multi-column) B+ Tree indexes.",
        topicID: T.DBMS,
        subtopicIDs: [S["Indexing"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A composite index on `(A, B, C)` can accelerate queries filtering on `(A)`, `(A, B)`, or `(A, B, C)`, because keys are ordered first by `A`, then `B`, then `C`. Filtering only on `B` or `C` without `A` cannot use the index for a standard range seek.",
      },
      {
        statement:
          "What is a covering index (index-only scan), and how does it reduce disk I/O?",
        topicID: T.DBMS,
        subtopicIDs: [S["Indexing"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A covering index includes all columns referenced by a query's `WHERE`, `JOIN`, and `SELECT` clauses. The database satisfies the query entirely from the index leaf pages without performing random table-heap lookups, drastically cutting disk I/O.",
      },

      // --- Transactions & ACID (3) ---
      {
        statement:
          "Define each letter in ACID (Atomicity, Consistency, Isolation, Durability) with a brief banking example.",
        topicID: T.DBMS,
        subtopicIDs: [S["Transactions & ACID"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Atomicity ensures debit and credit both succeed or both roll back; Consistency ensures total balance and schema constraints remain valid; Isolation prevents concurrent transfers from seeing intermediate states; Durability guarantees committed transfers survive crashes.",
      },
      {
        statement:
          "How does Write-Ahead Logging (WAL) guarantee both Atomicity and Durability after a sudden power failure?",
        topicID: T.DBMS,
        subtopicIDs: [S["Transactions & ACID"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "WAL flushes log records to durable storage before dirty data pages are written to disk. On crash recovery, the database replays (REDO) committed transactions from the log for Durability and rolls back (UNDO) uncommitted transactions for Atomicity.",
      },
      {
        statement:
          "Explain Multi-Version Concurrency Control (MVCC) and how it allows readers to avoid blocking writers.",
        topicID: T.DBMS,
        subtopicIDs: [S["Transactions & ACID"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "MVCC keeps multiple timestamped versions of modified rows instead of overwriting in place. Each transaction reads a consistent snapshot of row versions committed before its start time, so readers do not block writers and writers do not block readers.",
      },

      // =========================================================
      // OS (12 Theory Questions)
      // =========================================================
      // --- Concurrency (3) ---
      {
        statement:
          "What is a race condition, and what is a critical section in concurrent programming?",
        topicID: T.OS,
        subtopicIDs: [S["Concurrency"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A race condition occurs when a program's outcome depends on the unpredictable timing or interleaving of concurrent threads accessing shared mutable state. A critical section is the code segment accessing that shared resource that must execute with mutual exclusion.",
      },
      {
        statement:
          "Compare busy-waiting (spinlocks) with blocking locks (mutexes). When is a spinlock actually faster?",
        topicID: T.OS,
        subtopicIDs: [S["Concurrency"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A spinlock loops continuously checking the lock, burning CPU cycles, while a blocking mutex puts the waiting thread to sleep via a context switch. A spinlock is faster on multi-core systems when the lock is held for less time than two context switches.",
      },
      {
        statement:
          "Explain the Producer-Consumer problem and how condition variables (or semaphores) prevent both buffer overflow and busy waiting.",
        topicID: T.OS,
        subtopicIDs: [S["Concurrency"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Producers add items to a bounded buffer and consumers remove them. Using a mutex with `not_full` and `not_empty` condition variables (or `empty`/`full` counting semaphores) puts producers to sleep when the buffer is full and consumers to sleep when empty, waking them only when space or items become available.",
      },

      // --- Deadlocks (3) ---
      {
        statement:
          "Explain the difference between deadlock, livelock, and starvation.",
        topicID: T.OS,
        subtopicIDs: [S["Deadlocks"], S["Concurrency"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "In a deadlock, processes are permanently blocked waiting for each other's resources. In a livelock, processes keep changing state in response to each other without making progress. In starvation, a process is perpetually denied resources because higher-priority tasks keep preempting it.",
      },
      {
        statement:
          "How does the Banker's Algorithm perform deadlock avoidance, and what is a 'safe state'?",
        topicID: T.OS,
        subtopicIDs: [S["Deadlocks"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A state is safe if there exists at least one execution sequence in which every process can obtain its maximum declared resources and finish. Before granting a request, the Banker's Algorithm simulates the allocation and approves it only if the resulting state remains safe.",
      },
      {
        statement:
          "How does a Resource Allocation Graph (RAG) detect deadlocks, and why is a cycle sufficient for single-instance resources but only necessary for multi-instance resources?",
        topicID: T.OS,
        subtopicIDs: [S["Deadlocks"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "In a RAG, directed edges represent resource requests and assignments. If every resource type has only one instance, a cycle guarantees a deadlock. With multiple instances, a process outside the cycle might finish and release an instance, breaking the cycle without deadlock.",
      },

      // --- Memory Management (3) ---
      {
        statement:
          "Explain the difference between internal fragmentation and external fragmentation.",
        topicID: T.OS,
        subtopicIDs: [S["Memory Management"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Internal fragmentation is wasted space inside an allocated fixed-size block (such as the unused tail of a memory page). External fragmentation occurs when enough total free memory exists to satisfy a request, but it is scattered in non-contiguous small holes.",
      },
      {
        statement:
          "What is thrashing in a virtual memory system, and how does the Working Set model help prevent it?",
        topicID: T.OS,
        subtopicIDs: [S["Memory Management"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Thrashing occurs when processes spend more time swapping pages to and from disk (page faults) than executing instructions because too many processes compete for too few frames. Tracking each process's active Working Set lets the OS suspend processes when total working sets exceed available RAM.",
      },
      {
        statement:
          "Compare FIFO, Optimal (Belady's), and LRU page replacement algorithms, and explain Belady's Anomaly.",
        topicID: T.OS,
        subtopicIDs: [S["Memory Management"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "FIFO evicts the oldest loaded page, Optimal evicts the page unused longest in the future (theoretical lower bound), and LRU approximates Optimal by evicting the least recently used page. Belady's Anomaly is the counterintuitive phenomenon where giving FIFO more memory frames can actually increase page faults (stack algorithms like LRU are immune).",
      },

      // --- CPU Scheduling (3) ---
      {
        statement:
          "What is a context switch, and what information does the OS save inside a Process Control Block (PCB)?",
        topicID: T.OS,
        subtopicIDs: [S["CPU Scheduling"]],
        difficulty: "Easy",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "A context switch saves the state of the currently running process and restores the state of the next scheduled process. The PCB stores the PID, process state, program counter, CPU registers, scheduling priority, memory page-table pointers, and open file descriptors.",
      },
      {
        statement:
          "Explain the convoy effect in First-Come, First-Served (FCFS) scheduling and how Shortest Job First (SJF) mitigates it.",
        topicID: T.OS,
        subtopicIDs: [S["CPU Scheduling"]],
        difficulty: "Medium",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "The convoy effect occurs in FCFS when a single long CPU-bound process holds the CPU while many short I/O-bound processes wait behind it, hurting average waiting time and I/O utilization. SJF schedules shorter bursts first, dramatically lowering average waiting time.",
      },
      {
        statement:
          "What is priority inversion in preemptive priority scheduling, and how does priority inheritance solve it?",
        topicID: T.OS,
        subtopicIDs: [S["CPU Scheduling"], S["Concurrency"]],
        difficulty: "Hard",
        type: "Theory",
        isArchived: false,
        modelAnswer:
          "Priority inversion happens when a high-priority task waits on a lock held by a low-priority task, which itself gets preempted by a medium-priority task—indefinitely delaying the high-priority task. Priority inheritance temporarily boosts the lock-holding low-priority task to the waiting high-priority task's priority until it releases the lock.",
      },
    ];

    // 3. Skip any questions whose statement already exists in MongoDB
    const existingDocs = await Question.find(
      { statement: { $in: newQuestions.map((q) => q.statement) } },
      { statement: 1 },
    ).lean();
    const existingStatements = new Set(existingDocs.map((d) => d.statement));

    const toInsert = newQuestions.filter(
      (q) => !existingStatements.has(q.statement),
    );

    if (toInsert.length === 0) {
      console.log("All 50 questions are already seeded. Nothing to insert.");
    } else {
      await Question.insertMany(toInsert);
      console.log(`Inserted ${toInsert.length} new questions!`);
    }

    const totalCount = await Question.countDocuments();
    console.log(`Total questions now in database: ${totalCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding additional questions:", error);
    process.exit(1);
  }
};

seedMoreQuestions();
