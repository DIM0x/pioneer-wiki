:::zh
**Raft** 把共识问题拆成三个相对独立的子问题：领导者选举、日志复制和安全性。它与 Paxos 提供同样的保证，但设计时把“容易被人理解”放在第一位。
:::

:::en
**Raft** splits consensus into three fairly independent problems: leader election, log replication and safety. It gives the same guarantees as Paxos, but was designed with understandability as the first goal.
:::

## 角色与任期 | Roles and terms

:::zh
每台服务器处于跟随者、候选人或领导者之一。时间被划分为连续编号的**任期**；每个任期至多一个领导者。跟随者在选举超时内收不到心跳，就自增任期并成为候选人，向其他服务器拉票。
:::

:::en
Each server is a follower, a candidate or the leader. Time is divided into numbered **terms**, each with at most one leader. A follower that hears no heartbeat within its election timeout increments the term, becomes a candidate and asks the others for votes.
:::
<!-- @since 2 -->

## 日志匹配性质 | The log matching property

:::zh
如果两份日志在某个索引上的条目任期相同，那么它们在该索引之前的所有条目都相同。领导者借助这条性质，只需找到与跟随者最后一致的位置，再覆盖其后的内容。
:::

:::en
If two logs contain an entry with the same index and term, they are identical in all entries up to that index. The leader relies on this to find the last point of agreement with a follower and overwrite everything after it.
:::

## 成员变更 | Membership changes

:::zh
直接从旧配置切换到新配置可能在同一任期产生两个多数派。Raft 采用联合共识，或一次只增删一台服务器，来避免这种情况。
:::

:::en
Switching straight from an old configuration to a new one could create two majorities in the same term. Raft avoids this with joint consensus, or by adding or removing one server at a time.
:::
<!-- @end -->
