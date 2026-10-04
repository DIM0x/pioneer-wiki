**Paxos** lets a set of processes agree on a single value even when messages are delayed or lost and processes crash and recover. Lamport first told it as the story of a part-time parliament on the Greek island of Paxos.

## Roles

- **Proposers** suggest values.
- **Acceptors** vote; a majority of them forms a quorum.
- **Learners** find out which value was chosen.

## Two phases

1. **Prepare** — a proposer picks a ballot number $b$ and asks acceptors to promise to ignore ballots lower than $b$. Each acceptor replies with the highest-numbered value it has already accepted, if any.
2. **Accept** — if a majority promised, the proposer asks them to accept a value: the one from the highest ballot reported, or its own if none was reported.

Any two majorities intersect, so a chosen value can never be overturned by a later ballot. Liveness is not guaranteed: two proposers can keep pre-empting each other, which is why practical systems elect a distinguished leader.

> Multi-Paxos runs phase 1 once per leader and then streams phase 2 for each log slot — the shape Raft later made explicit.
