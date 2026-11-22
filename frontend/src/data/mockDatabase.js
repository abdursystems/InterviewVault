import {
  buildModeTransitionInfo,
  determineNextPlanMode,
  extractMockPythonStdout,
} from '../utils/diagnostics';
import {
  hasSubtopicTagSetChanged,
  validateAdminQuestionPayload,
} from '../utils/adminUtils';

const STORAGE_KEY = 'iv_mock_state_v2';
const LOCKOUT_KEY = 'iv_mock_lockout_v1';

export const MOCK_TOPICS = [
  { _id: 'top_dsa', name: 'DSA' },
  { _id: 'top_oop', name: 'OOP' },
  { _id: 'top_dbms', name: 'DBMS' },
  { _id: 'top_os', name: 'OS' },
];

export const MOCK_SUBTOPICS = [
  { _id: 'sub_dsa_recursion', name: 'Recursion', topicID: 'top_dsa' },
  { _id: 'sub_dsa_dp', name: 'Dynamic Programming', topicID: 'top_dsa' },
  { _id: 'sub_dsa_graphs', name: 'Graphs & Trees', topicID: 'top_dsa' },
  { _id: 'sub_dsa_sliding', name: 'Sliding Window', topicID: 'top_dsa' },
  { _id: 'sub_oop_solid', name: 'SOLID Principles', topicID: 'top_oop' },
  { _id: 'sub_oop_poly', name: 'Polymorphism & Inheritance', topicID: 'top_oop' },
  { _id: 'sub_oop_patterns', name: 'Design Patterns', topicID: 'top_oop' },
  { _id: 'sub_dbms_indexing', name: 'Indexing & B-Trees', topicID: 'top_dbms' },
  { _id: 'sub_dbms_acid', name: 'Transactions & ACID', topicID: 'top_dbms' },
  { _id: 'sub_dbms_norm', name: 'Normalization & SQL', topicID: 'top_dbms' },
  { _id: 'sub_os_concurrency', name: 'Concurrency & Deadlocks', topicID: 'top_os' },
  { _id: 'sub_os_vmem', name: 'Virtual Memory', topicID: 'top_os' },
  { _id: 'sub_os_sched', name: 'CPU Scheduling', topicID: 'top_os' },
];

const topicById = Object.fromEntries(MOCK_TOPICS.map((t) => [t._id, t]));
const subtopicById = Object.fromEntries(
  MOCK_SUBTOPICS.map((s) => [s._id, { _id: s._id, name: s.name }])
);

function makeQuestion(q) {
  return {
    _id: q._id,
    statement: q.statement,
    topicID: topicById[q.topicId],
    subtopicIDs: q.subtopicIds.map((id) => subtopicById[id]),
    difficulty: q.difficulty,
    type: q.type,
    modelAnswer: q.modelAnswer,
    testCases: q.testCases,
  };
}

export const MOCK_QUESTIONS = [
  makeQuestion({
    _id: 'q_dsa_rec_1',
    topicId: 'top_dsa',
    subtopicIds: ['sub_dsa_recursion'],
    difficulty: 'Medium',
    type: 'Coding',
    statement: `Generate Balanced Parentheses Combinations

Given an integer \`n\` representing pairs of parentheses, implement \`def generate_parentheses(n: int) -> list[str]\` to return all combinations of well-formed parentheses in lexicographical order.

Constraints:
- 1 <= n <= 8
- Output must not contain duplicates.

Example:
Input: n = 3
Output: ["((()))", "(()())", "(())()", "()(())", "()()()"]`,
    testCases: [
      { input: 'n = 1', expectedOutput: '["()"]', isHidden: false },
      { input: 'n = 2', expectedOutput: '["(())", "()()"]', isHidden: false },
      {
        input: 'n = 3',
        expectedOutput: '["((()))", "(()())", "(())()", "()(())", "()()()"]',
        isHidden: false,
      },
      { input: 'n = 4', expectedOutput: '14 valid combinations (Catalan C4)', isHidden: true },
      { input: 'n = 6', expectedOutput: '132 valid combinations (Catalan C6)', isHidden: true },
    ],
  }),
  makeQuestion({
    _id: 'q_dsa_rec_2',
    topicId: 'top_dsa',
    subtopicIds: ['sub_dsa_recursion', 'sub_dsa_graphs'],
    difficulty: 'Medium',
    type: 'Coding',
    statement: `Path Sum Root-to-Leaf Collector

Given a binary tree represented as a level-order list (with \`None\` for missing nodes) and an integer \`target_sum\`, implement \`def path_sums(tree: list, target_sum: int) -> list[list[int]]\` that returns all root-to-leaf paths where the sum of node values equals \`target_sum\`.

Constraints:
- Number of nodes <= 5000
- Node values can be negative.

Example:
Input: tree = [5, 4, 8, 11, None, 13, 4, 7, 2, None, None, 5, 1], target_sum = 22
Output: [[5, 4, 11, 2], [5, 8, 4, 5]]`,
    testCases: [
      { input: 'tree = [5, 4, 8, 11, None, 13, 4], target_sum = 20', expectedOutput: '[[5, 4, 11]]', isHidden: false },
      { input: 'tree = [1, 2, 3], target_sum = 5', expectedOutput: '[]', isHidden: false },
      { input: 'tree = [-2, None, -3], target_sum = -5', expectedOutput: '[[-2, -3]]', isHidden: true },
      { input: 'tree = [], target_sum = 0', expectedOutput: '[]', isHidden: true },
    ],
  }),
  makeQuestion({
    _id: 'q_dsa_rec_3',
    topicId: 'top_dsa',
    subtopicIds: ['sub_dsa_recursion'],
    difficulty: 'Easy',
    type: 'Coding',
    statement: `Power Set Generation via Backtracking

Given a list of unique integers \`nums\`, implement \`def subsets(nums: list[int]) -> list[list[int]]\` returning all possible subsets (the power set) without duplicates.

Constraints:
- 0 <= len(nums) <= 10
- All elements in \`nums\` are distinct.

Example:
Input: nums = [1, 2]
Output: [[], [1], [2], [1, 2]]`,
    testCases: [
      { input: 'nums = [1, 2]', expectedOutput: '[[], [1], [2], [1, 2]]', isHidden: false },
      { input: 'nums = [0]', expectedOutput: '[[], [0]]', isHidden: false },
      { input: 'nums = []', expectedOutput: '[[]]', isHidden: true },
      { input: 'nums = [1, 2, 3]', expectedOutput: '8 distinct subsets', isHidden: true },
    ],
  }),
  makeQuestion({
    _id: 'q_dsa_dp_1',
    topicId: 'top_dsa',
    subtopicIds: ['sub_dsa_dp', 'sub_dsa_recursion'],
    difficulty: 'Hard',
    type: 'Coding',
    statement: `Minimum Edit Distance (Levenshtein)

Given two strings \`word1\` and \`word2\`, implement \`def min_distance(word1: str, word2: str) -> int\` returning the minimum number of operations (insert, delete, or replace a single character) required to convert \`word1\` into \`word2\`.

Constraints:
- 0 <= len(word1), len(word2) <= 500
- Target O(m * n) time and O(min(m, n)) space.

Example:
Input: word1 = "horse", word2 = "ros"
Output: 3`,
    testCases: [
      { input: 'word1 = "horse", word2 = "ros"', expectedOutput: '3', isHidden: false },
      { input: 'word1 = "intention", word2 = "execution"', expectedOutput: '5', isHidden: false },
      { input: 'word1 = "", word2 = "abc"', expectedOutput: '3', isHidden: true },
      { input: 'word1 = "algorithm", word2 = "altruistic"', expectedOutput: '6', isHidden: true },
    ],
  }),
  makeQuestion({
    _id: 'q_dsa_sliding_1',
    topicId: 'top_dsa',
    subtopicIds: ['sub_dsa_sliding'],
    difficulty: 'Medium',
    type: 'Coding',
    statement: `Longest Substring Without Repeating Characters

Given a string \`s\`, implement \`def length_of_longest_substring(s: str) -> int\` that returns the length of the longest contiguous substring containing all unique characters.

Constraints:
- 0 <= len(s) <= 50000
- Must run in O(n) time using a sliding window index map.

Example:
Input: s = "abcabcbb"
Output: 3`,
    testCases: [
      { input: 's = "abcabcbb"', expectedOutput: '3', isHidden: false },
      { input: 's = "bbbbb"', expectedOutput: '1', isHidden: false },
      { input: 's = "pwwkew"', expectedOutput: '3', isHidden: false },
      { input: 's = ""', expectedOutput: '0', isHidden: true },
    ],
  }),
  makeQuestion({
    _id: 'q_dsa_graphs_1',
    topicId: 'top_dsa',
    subtopicIds: ['sub_dsa_graphs'],
    difficulty: 'Medium',
    type: 'Coding',
    statement: `Course Schedule Cycle Detection (Topological Sort)

Given \`num_courses\` labeled \`0\` to \`num_courses - 1\` and a list of prerequisite pairs \`[course, prereq]\`, implement \`def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool\` to determine whether all courses can be completed.

Constraints:
- 1 <= num_courses <= 2000
- Detect cycles using Kahn's BFS in-degree algorithm or 3-color DFS.

Example:
Input: num_courses = 2, prerequisites = [[1, 0], [0, 1]]
Output: False`,
    testCases: [
      { input: 'num_courses = 2, prerequisites = [[1, 0]]', expectedOutput: 'True', isHidden: false },
      { input: 'num_courses = 2, prerequisites = [[1, 0], [0, 1]]', expectedOutput: 'False', isHidden: false },
      { input: 'num_courses = 4, prerequisites = [[1,0],[2,1],[3,2]]', expectedOutput: 'True', isHidden: true },
    ],
  }),
  makeQuestion({
    _id: 'q_oop_solid_1',
    topicId: 'top_oop',
    subtopicIds: ['sub_oop_solid'],
    difficulty: 'Medium',
    type: 'Theory',
    statement: `Liskov Substitution Principle (LSP) Violation Analysis

Explain the Liskov Substitution Principle in object-oriented design. Why does modeling \`Square\` as a subclass of \`Rectangle\` with mutable \`setWidth\` and \`setHeight\` violate LSP, and how should the hierarchy be refactored?`,
    modelAnswer: `### Core Principle
The Liskov Substitution Principle states that if \`S\` is a subtype of \`T\`, objects of type \`T\` in a program may be replaced with objects of type \`S\` without altering any desirable behavioral properties (preconditions, postconditions, and invariants) of that program.

### Why Square <: Rectangle Fails
1. **Broken Postcondition**: A caller holding a \`Rectangle\` reference expects \`rect.setWidth(5); rect.setHeight(4)\` to result in \`rect.area() == 20\`.
2. **Hidden Coupling**: If \`Square\` overrides \`setWidth\` and \`setHeight\` to keep both sides equal, calling \`setHeight(4)\` silently mutates width to \`4\`, yielding area \`16\` and breaking the parent contract.
3. **Behavioral vs. Mathematical Subtyping**: Mathematical "is-a" relationships do not guarantee behavioral substitutability once mutability is introduced.

### Clean Refactoring
- Define a read-only \`Shape\` interface or abstract base class exposing \`area()\` and \`perimeter()\`.
- Implement \`Rectangle\` and \`Square\` as independent siblings, or make geometric value objects immutable so no setter contract can be violated.`,
  }),
  makeQuestion({
    _id: 'q_oop_poly_1',
    topicId: 'top_oop',
    subtopicIds: ['sub_oop_poly'],
    difficulty: 'Easy',
    type: 'Theory',
    statement: `Dynamic Dispatch and Virtual Method Tables (vtable)

How does runtime polymorphism (dynamic dispatch) work under the hood in compiled OOP languages such as C++ or Java? Contrast it with compile-time static dispatch (method overloading) in terms of memory overhead and performance.`,
    modelAnswer: `### Runtime Mechanism (vtable + vptr)
- Each class with at least one virtual method gets a compiler-generated **virtual method table (vtable)** containing function pointers to the most-derived overrides for that class.
- Each object instance stores a hidden pointer (**vptr**) pointing to its class's vtable.
- On a virtual call, the runtime dereferences \`obj->vptr[slot]\` and invokes the target function address dynamically.

### Comparison with Static Dispatch
| Dimension | Dynamic Dispatch (Overriding) | Static Dispatch (Overloading) |
| :--- | :--- | :--- |
| Resolution Time | Runtime via vtable lookup | Compile time via signature matching |
| Memory Overhead | 1 pointer (\`vptr\`) per object + 1 vtable per class | Zero per-object overhead |
| Optimization | Harder to inline (unless devirtualized by JIT/LTO) | Easily inlined by compiler |

### Engineering Trade-off
Dynamic dispatch enables extensible plugin architectures and Dependency Inversion at the minor cost of an indirect jump and prevented static inlining.`,
  }),
  makeQuestion({
    _id: 'q_oop_patterns_1',
    topicId: 'top_oop',
    subtopicIds: ['sub_oop_patterns', 'sub_oop_solid'],
    difficulty: 'Hard',
    type: 'Theory',
    statement: `Composition Over Inheritance: Strategy vs. Decorator Pattern

Compare the Strategy pattern and the Decorator pattern. Give a concrete systems engineering example for each and explain when deep inheritance trees become an anti-pattern.`,
    modelAnswer: `### Core Distinction
- **Strategy Pattern** swaps an entire algorithm or behavior behind a stable interface (e.g., choosing between \`RateLimiter\` policies: Token Bucket vs. Sliding Window Log). The context delegates work to one interchangeable strategy.
- **Decorator Pattern** wraps an existing object implementing the same interface to layer additional responsibilities dynamically (e.g., wrapping a \`DataStream\` with \`BufferedStream\` and \`GzipCompressionStream\`).

### Why Deep Inheritance Fails
1. **Combinatorial Explosion**: Combining orthogonal features (e.g., Retry + Logging + Compression + Encryption) creates $2^n$ subclasses.
2. **Fragile Base Class Problem**: Changing a protected helper in a superclass unintentionally breaks distant subclasses.
3. **Runtime Rigidity**: Inheritance binds behavior at compile time; composition lets you assemble pipelines at runtime.`,
  }),
  makeQuestion({
    _id: 'q_dbms_idx_1',
    topicId: 'top_dbms',
    subtopicIds: ['sub_dbms_indexing'],
    difficulty: 'Medium',
    type: 'Theory',
    statement: `B+ Trees vs. Hash Indexes in Relational Databases

Why do relational databases like PostgreSQL and InnoDB default to B+ Trees instead of Hash indexes? Detail how B+ Trees optimize disk I/O, range scans, and leftmost-prefix composite queries.`,
    modelAnswer: `### Why B+ Trees Dominate Disk-Backed Storage
1. **High Fan-out & Shallow Height**: Internal nodes store only routing keys and child pointers (no row payloads), maximizing keys per 8KB/16KB page. A 3-4 level B+ Tree can index tens of millions of rows in <= 4 page reads.
2. **Range Queries & Ordered Scans**: All leaf nodes are linked sequentially in a doubly linked list. Queries using \`BETWEEN\`, \`>\`, \`<\`, \`ORDER BY\`, or \`LIKE 'prefix%'\` locate the start key in $O(\\log_B N)$ and scan leaves linearly.
3. **Composite Leftmost Prefix**: An index on \`(user_id, created_at)\` accelerates queries filtering on \`user_id\` alone or \`(user_id, created_at)\`.

### Limitations of Hash Indexes
- Support only exact equality lookups (\`=\`), never range predicates or sorting.
- Cannot serve partial composite key prefixes.
- Historically harder to maintain crash-safe WAL recovery and bucket resizing under heavy write skew.`,
  }),
  makeQuestion({
    _id: 'q_dbms_acid_1',
    topicId: 'top_dbms',
    subtopicIds: ['sub_dbms_acid'],
    difficulty: 'Hard',
    type: 'Theory',
    statement: `Isolation Levels, MVCC, and Phantom Reads

Explain how Multi-Version Concurrency Control (MVCC) prevents readers from blocking writers. Contrast \`READ COMMITTED\`, \`REPEATABLE READ\`, and \`SERIALIZABLE\` isolation levels with respect to dirty reads, non-repeatable reads, phantom reads, and write skew.`,
    modelAnswer: `### How MVCC Works
- Updates create a new tuple version stamped with transaction visibility metadata (\`xmin\`/\`xmax\` in PostgreSQL or undo-log pointers in InnoDB) rather than overwriting in place.
- Each transaction reads a consistent snapshot based on its snapshot ID, so readers never acquire shared locks that block concurrent writers.

### Isolation Level Anomaly Matrix
- **Read Committed**: Prevents dirty reads. Each statement sees a fresh snapshot, so non-repeatable reads and phantom reads can occur.
- **Repeatable Read**: Transaction keeps one snapshot from the first statement. Prevents dirty reads and non-repeatable reads; in Snapshot Isolation (PostgreSQL), phantom reads are prevented, though **write skew** across disjoint rows remains possible.
- **Serializable**: Guarantees equivalence to some serial execution order (via Serializable Snapshot Isolation / predicate locks or strict 2PL), eliminating write skew at the cost of serialization retries.`,
  }),
  makeQuestion({
    _id: 'q_dbms_norm_1',
    topicId: 'top_dbms',
    subtopicIds: ['sub_dbms_norm'],
    difficulty: 'Easy',
    type: 'Theory',
    statement: `3NF vs. BCNF and Strategic Denormalization

Define Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF). When is a relation in 3NF but not BCNF, and in what production scenarios is intentional denormalization justified?`,
    modelAnswer: `### Formal Definitions
- **3NF**: Relation is in 2NF and has no transitive dependencies of non-prime attributes on a candidate key (for every non-trivial FD $X \\to A$, either $X$ is a superkey or $A$ is a prime attribute).
- **BCNF**: Stronger condition—for every non-trivial FD $X \\to A$, $X$ MUST be a superkey.

### 3NF but Not BCNF Example
A table \`(Student, Course, Instructor)\` where each instructor teaches only one course (\`Instructor -> Course\`) and a student has one instructor per course (\`(Student, Course) -> Instructor\`). \`Course\` is prime so it satisfies 3NF, yet \`Instructor\` is not a superkey, violating BCNF.

### When to Denormalize
- Read-heavy analytical aggregations or high-QPS feeds where multi-table joins violate p99 latency budgets.
- Always pair denormalization with a clear source-of-truth write path (triggers, transactional outbox, or materialized views) to bound update anomalies.`,
  }),
  makeQuestion({
    _id: 'q_os_conc_1',
    topicId: 'top_os',
    subtopicIds: ['sub_os_concurrency'],
    difficulty: 'Medium',
    type: 'Theory',
    statement: `Coffman Deadlock Conditions and Practical Prevention

List the four Coffman conditions required for a deadlock to occur. For each condition, describe a concrete systems-level mitigation and identify which condition production systems most commonly break.`,
    modelAnswer: `### The Four Coffman Conditions (All 4 Required)
1. **Mutual Exclusion**: A resource cannot be shared simultaneously by multiple threads.
   - *Mitigation*: Use lock-free structures (CAS / atomic reads) or immutable snapshots where feasible.
2. **Hold and Wait**: A thread holds at least one lock while waiting to acquire additional locks.
   - *Mitigation*: Acquire all required locks atomically up front or release held locks on \`try_lock\` failure.
3. **No Preemption**: Locks cannot be forcibly revoked from a holding thread.
   - *Mitigation*: Timed lock acquisition with rollback/retry (common in database lock managers).
4. **Circular Wait**: A closed cycle of threads exists where each waits on a lock held by the next.
   - *Mitigation*: Enforce a **strict global lock acquisition ordering** (e.g., always lock accounts by ascending \`account_id\`).

### Most Practical Strategy in Production
Breaking **Circular Wait** via strict lock hierarchy is the lowest-overhead engineering defense; databases also run periodic wait-for graph cycle detectors to abort a victim transaction.`,
  }),
  makeQuestion({
    _id: 'q_os_vmem_1',
    topicId: 'top_os',
    subtopicIds: ['sub_os_vmem'],
    difficulty: 'Medium',
    type: 'Theory',
    statement: `Virtual Memory Translation, TLB Misses, and Thrashing

Trace the complete address translation path from a CPU virtual address to physical RAM using a multi-level page table and TLB. Explain how working-set overflow triggers thrashing and how the OS detects and recovers from it.`,
    modelAnswer: `### Address Translation Path
1. CPU issues a virtual address split into Virtual Page Number (VPN) and Page Offset.
2. MMU checks the **TLB** (hardware associative cache). On a **TLB hit**, the Physical Frame Number (PFN) is concatenated with the offset directly.
3. On a **TLB miss**, the hardware page-table walker traverses the multi-level page table (e.g., 4-level x86-64 radix tree starting at \`CR3\`).
4. If the Page Table Entry (PTE) present bit is 0, the CPU raises a **page fault** trap to the OS kernel, which loads the page from swap/disk, updates the PTE, and restarts the faulting instruction.

### Thrashing
- Occurs when the sum of active processes' **working sets** exceeds available physical frames, causing continuous page-out/page-in cycles and collapsing CPU utilization.
- **Detection & Recovery**: Monitor Page Fault Frequency (PFF) and disk swap I/O; suspend low-priority processes to free frames and restore working-set locality.`,
  }),
  makeQuestion({
    _id: 'q_os_sched_1',
    topicId: 'top_os',
    subtopicIds: ['sub_os_sched'],
    difficulty: 'Easy',
    type: 'Theory',
    statement: `Multi-Level Feedback Queue (MLFQ) and Starvation Prevention

Explain how a Multi-Level Feedback Queue scheduler balances interactive responsiveness with CPU-bound throughput without knowing job lengths in advance. How does it prevent starvation and priority gaming?`,
    modelAnswer: `### MLFQ Core Rules
1. Maintain multiple priority queues; higher-priority queues run first (Round-Robin within the same queue).
2. New jobs enter at the highest priority (assuming they might be short/interactive).
3. If a job exhausts its entire time allotment at a given level, demote its priority; if it yields early for I/O, keep its priority.

### Preventing Starvation & Gaming
- **Priority Boost**: Periodically move all jobs back to the topmost queue after interval $S$ so CPU-bound jobs are not starved by a constant stream of interactive tasks.
- **Total Allotment Accounting**: Track cumulative CPU time consumed at a priority level rather than resetting the quota on every I/O yield—this prevents malicious tasks from issuing a dummy I/O call right before the timeslice expires to stay at top priority indefinitely.`,
  }),
  makeQuestion({
    _id: 'q_os_conc_2',
    topicId: 'top_os',
    subtopicIds: ['sub_os_concurrency'],
    difficulty: 'Hard',
    type: 'Coding',
    statement: `Detect Deadlock in Wait-For Resource Graph

Given a dictionary \`wait_for\` mapping each process ID (string) to a list of process IDs it is currently blocked waiting on, implement \`def has_deadlock(wait_for: dict[str, list[str]]) -> bool\` returning \`True\` if a circular wait cycle exists and \`False\` otherwise.

Constraints:
- Up to 1000 processes.
- Graph may be disconnected and contain processes with empty wait lists.

Example:
Input: wait_for = {"P1": ["P2"], "P2": ["P3"], "P3": ["P1"]}
Output: True`,
    testCases: [
      { input: 'wait_for = {"P1": ["P2"], "P2": ["P3"], "P3": ["P1"]}', expectedOutput: 'True', isHidden: false },
      { input: 'wait_for = {"P1": ["P2"], "P2": ["P3"], "P3": []}', expectedOutput: 'False', isHidden: false },
      { input: 'wait_for = {"P1": ["P1"]}', expectedOutput: 'True', isHidden: true },
      { input: 'wait_for = {"A": ["B"], "C": ["D"], "D": ["C"]}', expectedOutput: 'True', isHidden: true },
    ],
  }),
];

function seedQuestionsList(now) {
  return MOCK_QUESTIONS.map((q, idx) => ({
    _id: q._id,
    statement: q.statement,
    topicID: q.topicID._id,
    subtopicIDs: q.subtopicIDs.map((s) => s._id),
    difficulty: q.difficulty,
    type: q.type,
    modelAnswer: q.modelAnswer || '',
    testCases: Array.isArray(q.testCases) ? q.testCases.map((tc) => ({ ...tc })) : [],
    isArchived: false,
    createdAt: new Date(now - (35 - idx) * 24 * 3600 * 1000).toISOString(),
  }));
}

function hydrateQuestionRecord(rawQ, subtopicsList) {
  if (!rawQ) return null;
  const topicId = typeof rawQ.topicID === 'string' ? rawQ.topicID : rawQ.topicID?._id;
  const topicObj = MOCK_TOPICS.find((t) => t._id === topicId) || { _id: topicId, name: 'Unknown' };
  const subMap = Object.fromEntries((subtopicsList || MOCK_SUBTOPICS).map((s) => [s._id, s]));
  const rawSubIds = Array.isArray(rawQ.subtopicIDs) ? rawQ.subtopicIDs : [];
  const subtopicIDs = rawSubIds
    .map((entry) => {
      const id = typeof entry === 'string' ? entry : entry?._id;
      const found = subMap[id];
      return found ? { _id: found._id, name: found.name } : null;
    })
    .filter(Boolean);

  return {
    _id: rawQ._id,
    statement: rawQ.statement,
    topicID: { _id: topicObj._id, name: topicObj.name },
    subtopicIDs,
    difficulty: rawQ.difficulty,
    type: rawQ.type,
    modelAnswer: rawQ.modelAnswer || '',
    testCases: Array.isArray(rawQ.testCases) ? rawQ.testCases.map((tc) => ({ ...tc })) : [],
    isArchived: Boolean(rawQ.isArchived),
    createdAt: rawQ.createdAt || new Date().toISOString(),
  };
}

function stripQuestionSummary(q) {
  return {
    _id: q._id,
    statement: q.statement,
    topicID: q.topicID,
    subtopicIDs: q.subtopicIDs,
    difficulty: q.difficulty,
    type: q.type,
  };
}

function buildInitialState() {
  const now = Date.now();
  const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();
  const daysAgo = (d) => new Date(now - d * 24 * 3600 * 1000).toISOString();

  return {
    subtopics: MOCK_SUBTOPICS.map((s) => ({ ...s })),
    questions: seedQuestionsList(now),
    users: [
      {
        _id: 'usr_admin_000',
        name: 'Elena Vance',
        email: 'admin@interviewvault.dev',
        password: 'Password123!',
        role: 'Admin',
        isActive: true,
        profileImageUrl: null,
        createdAt: daysAgo(45),
      },
      {
        _id: 'usr_maya_001',
        name: 'Maya Chen',
        email: 'maya.chen@cs.edu',
        password: 'Password123!',
        role: 'Student',
        isActive: true,
        profileImageUrl: null,
        createdAt: daysAgo(21),
      },
      {
        _id: 'usr_alex_002',
        name: 'Alex Rivera',
        email: 'alex.new@cs.edu',
        password: 'Password123!',
        role: 'Student',
        isActive: true,
        profileImageUrl: null,
        createdAt: daysAgo(7),
      },
      {
        _id: 'usr_jordan_003',
        name: 'Jordan Patel',
        email: 'jordan.pro@cs.edu',
        password: 'Password123!',
        role: 'Student',
        isActive: true,
        profileImageUrl: null,
        createdAt: daysAgo(14),
      },
      {
        _id: 'usr_sam_004',
        name: 'Samira Al-Mansoor',
        email: 'samira.cs@cs.edu',
        password: 'Password123!',
        role: 'Student',
        isActive: false,
        profileImageUrl: null,
        createdAt: daysAgo(30),
      },
    ],
    attemptsByUser: {
      usr_admin_000: [],
      usr_maya_001: [
        {
          _id: 'att_101',
          questionID: 'q_dsa_rec_1',
          status: 'Attempted',
          timeTakenSeconds: 742,
          createdAt: hoursAgo(3),
        },
        {
          _id: 'att_102',
          questionID: 'q_dsa_rec_2',
          status: 'Attempted',
          timeTakenSeconds: 615,
          createdAt: hoursAgo(18),
        },
        {
          _id: 'att_103',
          questionID: 'q_dsa_rec_3',
          status: 'Solved',
          timeTakenSeconds: 310,
          createdAt: daysAgo(1),
        },
        {
          _id: 'att_104',
          questionID: 'q_dsa_dp_1',
          status: 'Attempted',
          timeTakenSeconds: 890,
          createdAt: daysAgo(2),
        },
        {
          _id: 'att_105',
          questionID: 'q_dsa_sliding_1',
          status: 'Solved',
          timeTakenSeconds: 420,
          createdAt: daysAgo(2),
        },
        {
          _id: 'att_106',
          questionID: 'q_dsa_graphs_1',
          status: 'Solved',
          timeTakenSeconds: 530,
          createdAt: daysAgo(3),
        },
        {
          _id: 'att_107',
          questionID: 'q_oop_solid_1',
          status: 'Solved',
          timeTakenSeconds: 265,
          createdAt: daysAgo(1),
        },
        {
          _id: 'att_108',
          questionID: 'q_oop_poly_1',
          status: 'Solved',
          timeTakenSeconds: 195,
          createdAt: daysAgo(4),
        },
        {
          _id: 'att_109',
          questionID: 'q_oop_patterns_1',
          status: 'Solved',
          timeTakenSeconds: 480,
          createdAt: daysAgo(3),
        },
        {
          _id: 'att_110',
          questionID: 'q_dbms_idx_1',
          status: 'Solved',
          timeTakenSeconds: 340,
          createdAt: hoursAgo(26),
        },
        {
          _id: 'att_111',
          questionID: 'q_dbms_acid_1',
          status: 'Attempted',
          timeTakenSeconds: 510,
          createdAt: daysAgo(2),
        },
        {
          _id: 'att_111b',
          questionID: 'q_dbms_acid_1',
          status: 'Solved',
          timeTakenSeconds: 430,
          createdAt: hoursAgo(20),
        },
        {
          _id: 'att_112',
          questionID: 'q_dbms_norm_1',
          status: 'Solved',
          timeTakenSeconds: 225,
          createdAt: daysAgo(5),
        },
        {
          _id: 'att_113',
          questionID: 'q_os_conc_1',
          status: 'Attempted',
          timeTakenSeconds: 410,
          createdAt: hoursAgo(30),
        },
        {
          _id: 'att_113b',
          questionID: 'q_os_conc_2',
          status: 'Solved',
          timeTakenSeconds: 540,
          createdAt: hoursAgo(14),
        },
        {
          _id: 'att_114',
          questionID: 'q_os_vmem_1',
          status: 'Solved',
          timeTakenSeconds: 295,
          createdAt: daysAgo(3),
        },
        {
          _id: 'att_115',
          questionID: 'q_os_sched_1',
          status: 'Skipped',
          timeTakenSeconds: 48,
          createdAt: daysAgo(6),
        },
      ],
      usr_alex_002: [],
      usr_jordan_003: [
        { _id: 'att_201', questionID: 'q_dsa_rec_3', status: 'Solved', timeTakenSeconds: 210, createdAt: hoursAgo(12) },
        { _id: 'att_202', questionID: 'q_dsa_sliding_1', status: 'Solved', timeTakenSeconds: 300, createdAt: daysAgo(1) },
        { _id: 'att_203', questionID: 'q_oop_solid_1', status: 'Solved', timeTakenSeconds: 240, createdAt: daysAgo(1) },
        { _id: 'att_204', questionID: 'q_dbms_idx_1', status: 'Solved', timeTakenSeconds: 280, createdAt: daysAgo(2) },
        { _id: 'att_205', questionID: 'q_os_vmem_1', status: 'Solved', timeTakenSeconds: 315, createdAt: daysAgo(2) },
        { _id: 'att_206', questionID: 'q_dbms_norm_1', status: 'Solved', timeTakenSeconds: 190, createdAt: daysAgo(3) },
      ],
      usr_sam_004: [],
    },
    completedPlanQuestionsByUser: {
      usr_admin_000: [],
      usr_maya_001: ['q_dsa_rec_3'],
      usr_alex_002: [],
      usr_jordan_003: ['q_dsa_rec_3', 'q_dbms_idx_1'],
      usr_sam_004: [],
    },
    activeModeByUser: {
      usr_admin_000: 'Onboarding',
      usr_maya_001: 'RootCause',
      usr_alex_002: 'Onboarding',
      usr_jordan_003: 'GeneralPractice',
      usr_sam_004: 'Onboarding',
    },
    modeCycleByUser: {
      usr_admin_000: 0,
      usr_maya_001: 0,
      usr_alex_002: 0,
      usr_jordan_003: 0,
      usr_sam_004: 0,
    },
  };
}

export function loadMockState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && parsed.attemptsByUser) {
        let mutated = false;
        const now = Date.now();
        if (!Array.isArray(parsed.subtopics)) {
          parsed.subtopics = MOCK_SUBTOPICS.map((s) => ({ ...s }));
          mutated = true;
        }
        if (!Array.isArray(parsed.questions)) {
          parsed.questions = seedQuestionsList(now);
          mutated = true;
        }
        if (!parsed.users.some((u) => u._id === 'usr_admin_000')) {
          parsed.users.unshift({
            _id: 'usr_admin_000',
            name: 'Elena Vance',
            email: 'admin@interviewvault.dev',
            password: 'Password123!',
            role: 'Admin',
            isActive: true,
            profileImageUrl: null,
            createdAt: new Date(now - 45 * 24 * 3600 * 1000).toISOString(),
          });
          parsed.attemptsByUser.usr_admin_000 = [];
          mutated = true;
        }
        parsed.users = parsed.users.map((u, idx) => {
          if (typeof u.isActive === 'boolean' && u.createdAt) return u;
          mutated = true;
          return {
            ...u,
            isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
            profileImageUrl: u.profileImageUrl ?? null,
            createdAt: u.createdAt || new Date(now - (25 - idx) * 24 * 3600 * 1000).toISOString(),
          };
        });
        if (!parsed.activeModeByUser) {
          parsed.activeModeByUser = {
            usr_admin_000: 'Onboarding',
            usr_maya_001: 'RootCause',
            usr_alex_002: 'Onboarding',
            usr_jordan_003: 'GeneralPractice',
          };
          mutated = true;
        }
        if (!parsed.modeCycleByUser) {
          parsed.modeCycleByUser = {
            usr_admin_000: 0,
            usr_maya_001: 0,
            usr_alex_002: 0,
            usr_jordan_003: 0,
          };
          mutated = true;
        }
        if (mutated) {
          saveMockState(parsed);
        }
        return parsed;
      }
    }
  } catch {
    // ignore storage read failure
  }
  const seeded = buildInitialState();
  saveMockState(seeded);
  return seeded;
}

export function saveMockState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage write failure
  }
}

function loadLockouts() {
  try {
    return JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLockouts(data) {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function recordFailedLogin(email) {
  const key = email.toLowerCase();
  const lockouts = loadLockouts();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (lockouts[key] || []).filter((ts) => now - ts < windowMs);
  recent.push(now);
  lockouts[key] = recent;
  saveLockouts(lockouts);
  return recent.length;
}

export function isEmailLockedOut(email) {
  const key = email.toLowerCase();
  const lockouts = loadLockouts();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (lockouts[key] || []).filter((ts) => now - ts < windowMs);
  return recent.length >= 5;
}

export function clearFailedLogins(email) {
  const key = email.toLowerCase();
  const lockouts = loadLockouts();
  if (lockouts[key]) {
    delete lockouts[key];
    saveLockouts(lockouts);
  }
}

export function createMockToken(userId) {
  return `iv_mock_jwt_${userId}_${Date.now()}`;
}

export function getUserFromToken(token) {
  if (!token || typeof token !== 'string') return null;
  const state = loadMockState();
  const match = token.match(/^iv_mock_jwt_(.+?)_\d+$/);
  if (!match) return null;
  const userId = match[1];
  return state.users.find((u) => u._id === userId) || null;
}

function getHydratedQuestionsMap(state) {
  const list = (state.questions || []).map((q) => hydrateQuestionRecord(q, state.subtopics));
  return Object.fromEntries(list.map((q) => [q._id, q]));
}

export function getHydratedHistory(userId) {
  const state = loadMockState();
  const qMap = getHydratedQuestionsMap(state);
  const raw = state.attemptsByUser[userId] || [];
  return [...raw]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((att) => {
      const q = qMap[att.questionID];
      return {
        _id: att._id,
        questionID: q ? stripQuestionSummary(q) : null,
        status: att.status,
        timeTakenSeconds: att.timeTakenSeconds,
        createdAt: att.createdAt,
      };
    })
    .filter((att) => att.questionID !== null);
}

export function computeDashboardForUser(userId) {
  const history = getHydratedHistory(userId);
  if (history.length === 0) {
    return { topicStats: [], subtopicStats: [] };
  }

  const topicMap = new Map();
  for (const topic of MOCK_TOPICS) {
    topicMap.set(topic.name, {
      topicName: topic.name,
      solved: 0,
      attempted: 0,
      skipped: 0,
      accuracy: 0,
    });
  }

  const subtopicMap = new Map();

  for (const att of history) {
    const tName = att.questionID.topicID.name;
    const tEntry = topicMap.get(tName);
    if (tEntry) {
      if (att.status === 'Solved') tEntry.solved += 1;
      else if (att.status === 'Attempted') tEntry.attempted += 1;
      else if (att.status === 'Skipped') tEntry.skipped += 1;
    }

    for (const sub of att.questionID.subtopicIDs) {
      if (!subtopicMap.has(sub._id)) {
        subtopicMap.set(sub._id, {
          subtopicID: sub._id,
          subtopicName: sub.name,
          topicName: tName,
          solved: 0,
          attempted: 0,
          skipped: 0,
          accuracy: 0,
          lastPracticed: att.createdAt,
        });
      }
      const sEntry = subtopicMap.get(sub._id);
      if (att.status === 'Solved') sEntry.solved += 1;
      else if (att.status === 'Attempted') sEntry.attempted += 1;
      else if (att.status === 'Skipped') sEntry.skipped += 1;
      if (new Date(att.createdAt).getTime() > new Date(sEntry.lastPracticed).getTime()) {
        sEntry.lastPracticed = att.createdAt;
      }
    }
  }

  const topicStats = Array.from(topicMap.values()).map((t) => {
    const denom = t.solved + t.attempted;
    return {
      ...t,
      accuracy: denom > 0 ? Math.round((t.solved / denom) * 100) : 0,
    };
  });

  const subtopicStats = Array.from(subtopicMap.values())
    .map((s) => {
      const denom = s.solved + s.attempted;
      return {
        ...s,
        accuracy: denom > 0 ? Math.round((s.solved / denom) * 100) : 0,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  return { topicStats, subtopicStats };
}

export function computeRecoveryPlanForUser(userId) {
  const state = loadMockState();
  const history = getHydratedHistory(userId);
  const completedSet = new Set(state.completedPlanQuestionsByUser[userId] || []);
  const todayStr = new Date().toISOString().slice(0, 10);
  const { subtopicStats } = computeDashboardForUser(userId);
  const cycle = state.modeCycleByUser?.[userId] || 0;

  let activeMode = state.activeModeByUser?.[userId];
  if (!activeMode) {
    activeMode = history.length < 5 ? 'Onboarding' : determineNextPlanMode(subtopicStats).toMode;
    state.activeModeByUser = state.activeModeByUser || {};
    state.activeModeByUser[userId] = activeMode;
    saveMockState(state);
  }

  const qMap = getHydratedQuestionsMap(state);
  const activeQuestions = Object.values(qMap).filter((q) => !q.isArchived);

  const mkItem = (qId, role, reason) => {
    const q = qMap[qId] || activeQuestions[0] || Object.values(qMap)[0];
    return {
      questionID: stripQuestionSummary(q),
      role,
      reason,
      state: completedSet.has(q._id) ? 'Completed' : 'Pending',
    };
  };

  const withTransition = (payload) => {
    const items = payload.plan.items || [];
    const completedCount = items.filter((item) => item.state === 'Completed').length;
    const isComplete = items.length >= 5 && completedCount === items.length;
    return {
      ...payload,
      pendingTransition: isComplete ? buildModeTransitionInfo(activeMode, subtopicStats) : null,
    };
  };

  if (activeMode === 'Onboarding') {
    const items = [
      mkItem('q_dsa_rec_3', 'Focus', 'Baseline DSA recursion diagnostic to calibrate branching and base-case accuracy.'),
      mkItem('q_oop_poly_1', 'Focus', 'Core OOP runtime dispatch check to establish conceptual baseline.'),
      mkItem('q_dbms_norm_1', 'Retry', 'Foundational relational schema design check across normal forms.'),
      mkItem('q_os_sched_1', 'Review', 'Introductory OS scheduling mechanics to measure systems fluency.'),
      mkItem('q_dsa_sliding_1', 'Stretch', 'Medium-difficulty O(n) window problem to gauge algorithmic speed.'),
    ];
    const remaining = items.filter((item) => item.state !== 'Completed').length;

    return withTransition({
      message: 'Initial Assessment plan generated.',
      notice:
        remaining > 0
          ? `Solve ${remaining} more question${remaining === 1 ? '' : 's'} in your Initial Assessment to unlock your next personalized mode.`
          : null,
      plan: {
        _id: `plan_onboard_${todayStr}_${cycle}`,
        date: todayStr,
        mode: 'Onboarding',
        diagnosedSubtopicID: null,
        items,
      },
    });
  }

  if (activeMode === 'GeneralPractice') {
    const generalSets = [
      [
        mkItem('q_dsa_rec_1', 'Focus', 'Maintain backtracking fluency with lexicographical state-space pruning.'),
        mkItem('q_os_conc_2', 'Focus', 'Apply cycle detection to OS resource wait-for graphs in Python.'),
        mkItem('q_dbms_acid_1', 'Retry', 'Reinforce MVCC snapshot isolation and write-skew edge cases.'),
        mkItem('q_oop_solid_1', 'Review', 'Spaced repetition on Liskov Substitution invariants.'),
        mkItem('q_dsa_dp_1', 'Stretch', 'Hard dynamic programming challenge to push state transition mastery.'),
      ],
      [
        mkItem('q_dsa_sliding_1', 'Focus', 'Keep O(n) sliding-window pointer invariants sharp under time pressure.'),
        mkItem('q_dbms_idx_1', 'Focus', 'Reinforce B+ tree fanout and disk-page lookup fundamentals.'),
        mkItem('q_oop_poly_1', 'Retry', 'Revisit runtime polymorphism and method dispatch trade-offs.'),
        mkItem('q_os_vmem_1', 'Review', 'Spaced review of virtual memory paging and TLB locality.'),
        mkItem('q_dsa_graphs_1', 'Stretch', 'Graph traversal challenge to maintain multi-topic readiness.'),
      ],
    ];
    const items = generalSets[cycle % generalSets.length];
    const remaining = items.filter((item) => item.state !== 'Completed').length;

    return withTransition({
      message: 'All-Round Practice plan generated.',
      notice:
        remaining > 0
          ? 'All practiced subtopics currently exceed the 70% accuracy threshold. Maintaining readiness with a balanced cross-topic set.'
          : null,
      plan: {
        _id: `plan_general_${todayStr}_${cycle}`,
        date: todayStr,
        mode: 'GeneralPractice',
        diagnosedSubtopicID: null,
        items,
      },
    });
  }

  // Root-Cause mode (Weak-Spot Fix)
  const weakest =
    subtopicStats.find((s) => s.accuracy < 70 && s.solved + s.attempted >= 2) ||
    subtopicStats.find((s) => s.accuracy < 70 && s.solved + s.attempted > 0) ||
    subtopicStats[0] || {
      subtopicID: 'sub_dsa_recursion',
      subtopicName: 'Recursion',
      accuracy: 50,
      solved: 1,
      attempted: 1,
    };

  const diagnosed = { _id: weakest.subtopicID, name: weakest.subtopicName };
  const subtopicQuestions = activeQuestions.filter((q) =>
    q.subtopicIDs.some((s) => s._id === weakest.subtopicID)
  );
  const focus1 = subtopicQuestions[cycle % Math.max(1, subtopicQuestions.length)]?._id || 'q_dsa_rec_1';
  const focus1TopicId = qMap[focus1]?.topicID?._id;
  const focus2Candidate =
    subtopicQuestions.length > 1
      ? subtopicQuestions[(cycle + 1) % subtopicQuestions.length]?._id
      : activeQuestions.find((q) => q._id !== focus1 && q.topicID?._id === focus1TopicId)?._id;
  const focus2 =
    focus2Candidate && focus2Candidate !== focus1
      ? focus2Candidate
      : focus1 === 'q_dsa_rec_1'
      ? 'q_dsa_rec_2'
      : 'q_dsa_rec_1';
  const retryCandidate =
    history.find(
      (a) => a.status === 'Attempted' && a.questionID._id !== focus1 && a.questionID._id !== focus2
    )?.questionID._id || 'q_dbms_acid_1';
  const reviewCandidate =
    history.find(
      (a) =>
        a.status === 'Solved' &&
        ![focus1, focus2, retryCandidate].includes(a.questionID._id)
    )?.questionID._id || 'q_dbms_idx_1';
  const stretchCandidate =
    activeQuestions.find(
      (q) =>
        q.difficulty === 'Hard' &&
        ![focus1, focus2, retryCandidate, reviewCandidate].includes(q._id)
    )?._id || 'q_dsa_dp_1';

  return withTransition({
    message: 'Weak-Spot Fix recovery plan generated.',
    notice: null,
    plan: {
      _id: `plan_rc_${todayStr}_${cycle}`,
      date: todayStr,
      mode: 'RootCause',
      diagnosedSubtopicID: diagnosed,
      items: [
        mkItem(
          focus1,
          'Focus',
          `${weakest.subtopicName} accuracy is ${weakest.accuracy}% (${weakest.solved}/${weakest.solved + weakest.attempted} solved) — primary focus drill to close your lowest-accuracy bottleneck.`
        ),
        mkItem(
          focus2,
          'Focus',
          `Second focused ${weakest.subtopicName} exercise to reinforce core invariants and edge-case handling.`
        ),
        mkItem(
          retryCandidate,
          'Retry',
          'Previously attempted without passing all criteria — revisit while recall is active.'
        ),
        mkItem(
          reviewCandidate,
          'Review',
          'Spaced-repetition check on a previously solved concept to prevent retention decay.'
        ),
        mkItem(
          stretchCandidate,
          'Stretch',
          'Hard cross-concept stretch problem to test transfer under interview time pressure.'
        ),
      ],
    },
  });
}

export function advanceRecoveryModeForUser(userId) {
  const state = loadMockState();
  const { subtopicStats } = computeDashboardForUser(userId);
  const { toMode } = determineNextPlanMode(subtopicStats);

  state.activeModeByUser = state.activeModeByUser || {};
  state.modeCycleByUser = state.modeCycleByUser || {};
  state.completedPlanQuestionsByUser = state.completedPlanQuestionsByUser || {};

  state.activeModeByUser[userId] = toMode;
  state.modeCycleByUser[userId] = (state.modeCycleByUser[userId] || 0) + 1;
  state.completedPlanQuestionsByUser[userId] = [];
  saveMockState(state);

  return computeRecoveryPlanForUser(userId);
}

/**
 * Deterministic Python mock sandbox evaluator for Coding attempts.
 * Evaluates code structure & syntax signals so testers can observe realistic pass,
 * partial-failure, and syntax-error outputs without an external backend.
 */
export function evaluateMockPythonSubmission(question, code) {
  const trimmed = (code || '').trim();
  const cases = question.testCases || [];

  // Check basic syntax issues
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens || /\bSyntaxError\b|\braise\s+/.test(trimmed)) {
    return {
      status: 'Attempted',
      message: 'Execution halted with runtime/syntax error.',
      stdout: '',
      testDetails: cases.map((tc) => ({
        passed: false,
        actual: '',
        expected: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        error:
          openParens !== closeParens
            ? 'SyntaxError: unmatched parenthesis on submitted Python source'
            : 'RuntimeError: unhandled exception raised during execution',
      })),
    };
  }

  const stdout = extractMockPythonStdout(code);

  // Check if user left starter stub unchanged (only pass / comments)
  const nonCommentLines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const hasReturn = /\breturn\b/.test(trimmed);
  const isOnlyStub =
    !hasReturn ||
    (nonCommentLines.length <= 3 && nonCommentLines.some((l) => l === 'pass'));

  if (isOnlyStub) {
    return {
      status: 'Attempted',
      message: `0/${cases.length} test cases passed. Implement return logic to pass sandbox checks.`,
      stdout,
      testDetails: cases.map((tc) => ({
        passed: false,
        actual: 'None',
        expected: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        error: null,
      })),
    };
  }

  // Check for deliberate partial implementation (e.g. hardcoded return without loops/recursion)
  const hasControlFlow = /\b(for|while|if|def\s+\w+.*[\s\S]*\b\w+\()/.test(trimmed) && nonCommentLines.length >= 4;
  if (!hasControlFlow) {
    const testDetails = cases.map((tc, idx) => ({
      passed: idx === 0,
      actual: idx === 0 ? (tc.isHidden ? '[Hidden]' : tc.expectedOutput) : '[]',
      expected: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
      error: null,
    }));
    return {
      status: 'Attempted',
      message: `1/${cases.length} test cases passed. Edge cases failed.`,
      stdout,
      testDetails,
    };
  }

  // Full pass when meaningful Python logic with control flow + return is written
  return {
    status: 'Solved',
    message: `All ${cases.length}/${cases.length} test cases passed in Python sandbox.`,
    stdout,
    testDetails: cases.map((tc) => ({
      passed: true,
      actual: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
      expected: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
      error: null,
    })),
  };
}

export function getMockTaxonomy() {
  const state = loadMockState();
  return {
    topics: [...MOCK_TOPICS].sort((a, b) => a.name.localeCompare(b.name)),
    subtopics: (state.subtopics || MOCK_SUBTOPICS).map((s) => ({ ...s })),
  };
}

export function getFullQuestionById(id) {
  const state = loadMockState();
  const raw = (state.questions || []).find((q) => q._id === id);
  return raw ? hydrateQuestionRecord(raw, state.subtopics) : null;
}

export function getQuestionDetailById(id) {
  const full = getFullQuestionById(id);
  if (!full || full.isArchived) return null;
  const allCases = Array.isArray(full.testCases) ? full.testCases : [];
  const visibleCases = allCases.filter((tc) => !tc.isHidden);
  const hiddenTestCount = allCases.length - visibleCases.length;
  return {
    ...full,
    testCases: visibleCases,
    hiddenTestCount,
  };
}

export function listQuestionsSummary() {
  const state = loadMockState();
  return (state.questions || [])
    .filter((q) => !q.isArchived)
    .map((q) => stripQuestionSummary(hydrateQuestionRecord(q, state.subtopics)));
}

/* ============================================================================
 * ADMIN MOCK HANDLERS (FR-11, UC-15 TO UC-17, DFD PROCESS 7.0)
 * ========================================================================== */

function createMockDbError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function hydrateSubtopicRecord(sub) {
  const topic = MOCK_TOPICS.find((t) => t._id === sub.topicID) || {
    _id: sub.topicID,
    name: 'Unknown',
  };
  return {
    _id: sub._id,
    name: sub.name,
    topicID: { _id: topic._id, name: topic.name },
  };
}

function sanitizeAdminUser(u) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
    profileImageUrl: u.profileImageUrl ?? null,
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

function hasAnyAttemptForQuestion(state, questionId) {
  const allUserAttempts = Object.values(state.attemptsByUser || {});
  return allUserAttempts.some(
    (list) => Array.isArray(list) && list.some((att) => att.questionID === questionId)
  );
}

export function adminGetTopics() {
  return [...MOCK_TOPICS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ _id: t._id, name: t.name }));
}

export function adminGetSubtopics(topicID = '') {
  const state = loadMockState();
  let list = (state.subtopics || []).map(hydrateSubtopicRecord);
  if (topicID) {
    list = list.filter((s) => s.topicID._id === topicID);
  }
  return list.sort((a, b) => {
    const topicCmp = a.topicID.name.localeCompare(b.topicID.name);
    return topicCmp !== 0 ? topicCmp : a.name.localeCompare(b.name);
  });
}

export function adminCreateSubtopic({ topicID, name }) {
  const trimmedName = (name || '').trim();
  if (!topicID || !MOCK_TOPICS.some((t) => t._id === topicID)) {
    throw createMockDbError(400, 'Please select a valid topic.');
  }
  if (!trimmedName) {
    throw createMockDbError(400, 'Subtopic name is required.');
  }

  const state = loadMockState();
  const duplicate = (state.subtopics || []).some(
    (s) => s.topicID === topicID && s.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw createMockDbError(409, 'Subtopic already exists in this topic');
  }

  const created = {
    _id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: trimmedName,
    topicID,
  };
  state.subtopics.push(created);
  saveMockState(state);
  return hydrateSubtopicRecord(created);
}

export function adminUpdateSubtopic(id, { name }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    throw createMockDbError(400, 'Subtopic name is required.');
  }

  const state = loadMockState();
  const idx = (state.subtopics || []).findIndex((s) => s._id === id);
  if (idx === -1) {
    throw createMockDbError(404, 'Subtopic not found.');
  }

  const target = state.subtopics[idx];
  const duplicate = state.subtopics.some(
    (s) =>
      s._id !== id &&
      s.topicID === target.topicID &&
      s.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw createMockDbError(409, 'Subtopic already exists in this topic');
  }

  state.subtopics[idx] = { ...target, name: trimmedName };
  saveMockState(state);
  return hydrateSubtopicRecord(state.subtopics[idx]);
}

export function adminDeleteSubtopic(id) {
  const state = loadMockState();
  const idx = (state.subtopics || []).findIndex((s) => s._id === id);
  if (idx === -1) {
    throw createMockDbError(404, 'Subtopic not found.');
  }

  const usageCount = (state.questions || []).filter((q) =>
    (q.subtopicIDs || []).includes(id)
  ).length;
  if (usageCount > 0) {
    throw createMockDbError(409, `Cannot delete: ${usageCount} question(s) use this subtopic`);
  }

  state.subtopics.splice(idx, 1);
  saveMockState(state);
  return { deleted: true };
}

export function adminListQuestions(params = {}) {
  const state = loadMockState();
  let list = (state.questions || []).map((q) => hydrateQuestionRecord(q, state.subtopics));

  if (params.topicID) {
    list = list.filter((q) => q.topicID._id === params.topicID);
  }
  if (params.subtopicID) {
    list = list.filter((q) => q.subtopicIDs.some((s) => s._id === params.subtopicID));
  }
  if (params.difficulty) {
    list = list.filter((q) => q.difficulty === params.difficulty);
  }
  if (params.type) {
    list = list.filter((q) => q.type === params.type);
  }
  if (params.archived === 'true' || params.archived === true) {
    list = list.filter((q) => q.isArchived === true);
  } else if (params.archived === 'false' || params.archived === false) {
    list = list.filter((q) => q.isArchived === false);
  }
  if (params.q && String(params.q).trim()) {
    const term = String(params.q).trim().toLowerCase();
    list = list.filter(
      (q) =>
        q.statement.toLowerCase().includes(term) ||
        q.topicID.name.toLowerCase().includes(term) ||
        q.subtopicIDs.some((s) => s.name.toLowerCase().includes(term))
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  return { items, total, page, pages };
}

export function adminGetQuestionById(id) {
  const state = loadMockState();
  const raw = (state.questions || []).find((q) => q._id === id);
  if (!raw) {
    throw createMockDbError(404, 'Question not found.');
  }
  return hydrateQuestionRecord(raw, state.subtopics);
}

export function adminCreateQuestion(payload) {
  const state = loadMockState();
  const allowedSubIds = new Set(
    (state.subtopics || []).filter((s) => s.topicID === payload.topicID).map((s) => s._id)
  );
  const validation = validateAdminQuestionPayload(payload, allowedSubIds);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] || 'Invalid question payload.';
    throw createMockDbError(400, firstError);
  }

  const created = {
    _id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    statement: payload.statement.trim(),
    topicID: payload.topicID,
    subtopicIDs: Array.from(new Set(payload.subtopicIDs)),
    difficulty: payload.difficulty,
    type: payload.type,
    modelAnswer: payload.type === 'Theory' ? (payload.modelAnswer || '').trim() : '',
    testCases:
      payload.type === 'Coding'
        ? (payload.testCases || []).map((tc) => ({
            input: tc.input || '',
            expectedOutput: (tc.expectedOutput || '').trim(),
            isHidden: Boolean(tc.isHidden),
          }))
        : [],
    isArchived: false,
    createdAt: new Date().toISOString(),
  };

  state.questions.unshift(created);
  saveMockState(state);
  return hydrateQuestionRecord(created, state.subtopics);
}

export function adminUpdateQuestion(id, payload) {
  const state = loadMockState();
  const idx = (state.questions || []).findIndex((q) => q._id === id);
  if (idx === -1) {
    throw createMockDbError(404, 'Question not found.');
  }

  const existing = state.questions[idx];
  const allowedSubIds = new Set(
    (state.subtopics || []).filter((s) => s.topicID === payload.topicID).map((s) => s._id)
  );
  const validation = validateAdminQuestionPayload(payload, allowedSubIds);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] || 'Invalid question payload.';
    throw createMockDbError(400, firstError);
  }

  const nextSubIds = Array.from(new Set(payload.subtopicIDs));
  if (
    hasAnyAttemptForQuestion(state, id) &&
    hasSubtopicTagSetChanged(existing.subtopicIDs, nextSubIds)
  ) {
    throw createMockDbError(
      409,
      'This question already has attempts, so its subtopic tags cannot change. Archive it and create a new question instead.'
    );
  }

  state.questions[idx] = {
    ...existing,
    statement: payload.statement.trim(),
    topicID: payload.topicID,
    subtopicIDs: nextSubIds,
    difficulty: payload.difficulty,
    type: payload.type,
    modelAnswer: payload.type === 'Theory' ? (payload.modelAnswer || '').trim() : '',
    testCases:
      payload.type === 'Coding'
        ? (payload.testCases || []).map((tc) => ({
            input: tc.input || '',
            expectedOutput: (tc.expectedOutput || '').trim(),
            isHidden: Boolean(tc.isHidden),
          }))
        : [],
  };

  saveMockState(state);
  return hydrateQuestionRecord(state.questions[idx], state.subtopics);
}

export function adminDeleteQuestion(id) {
  const state = loadMockState();
  const idx = (state.questions || []).findIndex((q) => q._id === id);
  if (idx === -1) {
    throw createMockDbError(404, 'Question not found.');
  }

  if (hasAnyAttemptForQuestion(state, id)) {
    state.questions[idx] = { ...state.questions[idx], isArchived: true };
    saveMockState(state);
    return {
      archived: true,
      message: 'Question is in use, so it was archived instead of deleted',
    };
  }

  state.questions.splice(idx, 1);
  saveMockState(state);
  return { deleted: true };
}

export function adminRestoreQuestion(id) {
  const state = loadMockState();
  const idx = (state.questions || []).findIndex((q) => q._id === id);
  if (idx === -1) {
    throw createMockDbError(404, 'Question not found.');
  }

  state.questions[idx] = { ...state.questions[idx], isArchived: false };
  saveMockState(state);
  return hydrateQuestionRecord(state.questions[idx], state.subtopics);
}

export function adminListUsers() {
  const state = loadMockState();
  return [...(state.users || [])]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .map(sanitizeAdminUser);
}

export function adminUpdateUserRole(targetId, role, actorId) {
  if (targetId === actorId) {
    throw createMockDbError(400, 'You cannot change your own role.');
  }
  if (!['Student', 'Admin'].includes(role)) {
    throw createMockDbError(400, 'Role must be either Student or Admin.');
  }

  const state = loadMockState();
  const idx = (state.users || []).findIndex((u) => u._id === targetId);
  if (idx === -1) {
    throw createMockDbError(404, 'User not found.');
  }

  state.users[idx] = { ...state.users[idx], role };
  saveMockState(state);
  return sanitizeAdminUser(state.users[idx]);
}

export function adminUpdateUserActive(targetId, isActive, actorId) {
  if (targetId === actorId) {
    throw createMockDbError(400, 'You cannot deactivate your own account.');
  }
  if (typeof isActive !== 'boolean') {
    throw createMockDbError(400, 'isActive must be a boolean.');
  }

  const state = loadMockState();
  const idx = (state.users || []).findIndex((u) => u._id === targetId);
  if (idx === -1) {
    throw createMockDbError(404, 'User not found.');
  }

  state.users[idx] = { ...state.users[idx], isActive };
  saveMockState(state);
  return sanitizeAdminUser(state.users[idx]);
}

export function adminDeleteUser(targetId, actorId) {
  if (targetId === actorId) {
    throw createMockDbError(400, 'You cannot delete your own account.');
  }

  const state = loadMockState();
  const idx = (state.users || []).findIndex((u) => u._id === targetId);
  if (idx === -1) {
    throw createMockDbError(404, 'User not found.');
  }

  const userAttempts = state.attemptsByUser?.[targetId] || [];
  if (userAttempts.length > 0) {
    throw createMockDbError(
      409,
      'This user has attempts. Disable the account instead of deleting it.'
    );
  }

  state.users.splice(idx, 1);
  delete state.attemptsByUser[targetId];
  delete state.completedPlanQuestionsByUser[targetId];
  if (state.activeModeByUser) delete state.activeModeByUser[targetId];
  if (state.modeCycleByUser) delete state.modeCycleByUser[targetId];
  saveMockState(state);
  return { deleted: true };
}

export function switchMockUserRole(userId) {
  const state = loadMockState();
  const idx = (state.users || []).findIndex((u) => u._id === userId);
  if (idx === -1) return null;
  const nextRole = state.users[idx].role === 'Admin' ? 'Student' : 'Admin';
  state.users[idx] = { ...state.users[idx], role: nextRole };
  saveMockState(state);
  return {
    _id: state.users[idx]._id,
    name: state.users[idx].name,
    email: state.users[idx].email,
    role: state.users[idx].role,
  };
}
