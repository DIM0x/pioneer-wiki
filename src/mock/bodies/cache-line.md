A **cache line** is the smallest unit of data moved between main memory and a cache — 64 bytes on most current x86 and Arm cores. Asking for one byte brings in its 63 neighbours too.

## Why sequential access is fast

Walking an array touches every byte of each line it loads, and the hardware prefetcher fetches the next lines before they are needed. Walking a linked list scattered across the heap may pay a full miss per node.

## False sharing

Two threads writing *different* variables that happen to share one line force the line to bounce between cores, because coherence works per line, not per variable.

```c
struct counters {
    long a;   // written by thread 1
    long b;   // written by thread 2 — same 64-byte line as `a`
};

struct padded {
    _Alignas(64) long a;
    _Alignas(64) long b;  // now on separate lines
};
```

Padding or aligning hot, independently written fields to the line size removes the contention at the cost of memory.
