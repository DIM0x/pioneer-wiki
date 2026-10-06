:::zh
**操作系统内核**是操作系统中负责管理受保护资源、执行特权操作并向程序提供受控接口的核心部分。它通常协调处理器、内存、设备和进程；命令行、图形桌面和许多系统服务则运行在用户空间。内核不是整台计算机，也不必把所有驱动和服务都放在同一地址空间中。[S1][S2]
:::

:::en
An **operating-system kernel** is the core that manages protected resources, performs privileged operations, and provides controlled interfaces to programs. It commonly coordinates processors, memory, devices, and processes; shells, graphical desktops, and many system services run in user space. The kernel is neither the whole computer nor necessarily the place where every driver and service must reside. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
程序需要读文件、分配内存或创建进程时，不能任意改写磁盘、页表或其他进程的状态。它通过系统调用进入内核，请求一个有限、可检查的操作。硬件的特权级与地址转换规则提供隔离基础，内核负责校验请求、更新共享状态并处理设备结果。不同系统的边界并不相同：微内核把更多服务放到用户空间，宏内核把更多子系统留在内核空间；两者仍都需要可信的特权核心。
:::

:::en
A program that reads a file, allocates memory, or creates a process must not be free to rewrite a disk, page table, or another process's state. It enters the kernel through a system call and requests a bounded operation that can be checked. Processor privilege levels and address translation provide the basis for isolation; the kernel validates requests, updates shared state, and handles device results. The boundary varies by design: a microkernel moves more services to user space, while a monolithic kernel keeps more subsystems in kernel space. Both still need a trusted privileged core.
:::

## 工作机制 | How it works

:::zh
系统调用通常触发受控的特权级转换。内核检查参数和调用者权限，再把请求交给相应子系统。调度器决定哪个可运行线程取得处理器；虚拟内存代码维护进程地址空间与页表；文件系统把路径和文件操作映射到持久化对象；驱动则把通用请求转换为设备命令。阻塞 I/O 时，内核可暂停当前线程，让其他线程运行，设备完成后再唤醒它。这个过程需要同步、资源记账和错误处理，不能把一次调用理解成“直接访问硬件”。[S1][S2]
:::

:::en
A system call normally causes a controlled transition into privileged execution. The kernel checks arguments and caller permissions, then dispatches the request to a subsystem. A scheduler chooses which runnable thread receives a processor; virtual-memory code maintains address spaces and page tables; a file system maps paths and file operations to persistent objects; and a driver translates generic requests into device commands. For blocking I/O, the kernel can suspend the current thread, run another one, and wake the first when the device completes. Synchronization, resource accounting, and error handling are part of this path: a system call is not simply direct hardware access. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
应用调用 `open` 后，内核先解析路径、检查目录搜索权限和文件访问权限，再建立进程可使用的文件描述符。随后 `read` 通过这个描述符定位文件状态；数据可能来自页缓存，也可能需要存储设备读取。内核把允许该进程观察的字节复制到用户缓冲区，并返回实际读取长度或错误码。若路径不存在，系统调用失败而不会让应用绕过文件系统直接扫描磁盘。这一例同时展示名称解析、授权、缓存、驱动和用户态/内核态边界。
:::

:::en
After an application calls `open`, the kernel resolves the path, checks directory-search and file-access permissions, and creates a file descriptor the process may use. A later `read` uses that descriptor to find the file state. The bytes may come from a page cache or require a storage-device read. The kernel copies only the process-visible bytes into its user buffer and returns a length or an error code. If the path does not exist, the call fails; the application cannot bypass the file system and scan the disk directly. One short operation therefore crosses name resolution, authorization, caching, a driver, and the user/kernel boundary.
:::

## 局限与误解 | Limits and misconceptions

:::zh
“内核是唯一能碰硬件的程序”只是便于入门的说法：设备可通过 DMA、固件或虚拟机监控器参与工作，微内核也会把部分驱动放在用户空间。特权代码仍可能有漏洞；内核态并不自动等于正确或安全。内核升级、驱动故障、锁竞争和资源耗尽都可能造成系统级影响。宏内核通常减少跨进程通信开销，却扩大可信计算基；微内核缩小核心边界，却要求消息传递和服务恢复足够可靠。应按隔离、性能、可维护性和硬件生态权衡，而不是按名称判定优劣。[S1][S2]
:::

:::en
“The kernel is the only program that can touch hardware” is a useful first approximation, not a complete rule: devices can act through DMA, firmware, or a virtual-machine monitor, and microkernels may place some drivers in user space. Privileged code can still contain bugs; kernel mode does not make it correct or secure. Upgrades, driver faults, lock contention, and resource exhaustion can have system-wide effects. A monolithic kernel often avoids some inter-process communication overhead but enlarges the trusted computing base. A microkernel narrows that core but depends on reliable messaging and service recovery. Compare isolation, performance, maintainability, and hardware support instead of judging by the label alone. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[存储层次](/entries/memory-hierarchy)解释缓存、主存和持久化介质之间的速度与容量取舍；[TCP 拥塞控制](/entries/tcp-congestion-control)展示内核网络栈如何与端到端协议协作；[分布式系统](/entries/distributed-systems)讨论跨机器后出现的协调与部分故障。
:::

:::en
[Memory Hierarchy](/entries/memory-hierarchy) explains the speed and capacity trade-offs among caches, main memory, and persistent storage. [TCP Congestion Control](/entries/tcp-congestion-control) shows how a kernel network stack participates in an end-to-end protocol. [Distributed Systems](/entries/distributed-systems) examines coordination and partial failure across machines.
:::

## 参考资料 | References

:::zh
- [S1] Remzi H. Arpaci-Dusseau 与 Andrea C. Arpaci-Dusseau，《Operating Systems: Three Easy Pieces》，第 13 章“地址空间”。[章节 PDF](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf)
- [S2] Linux Kernel Documentation，*Page Tables*，进程虚拟地址到物理页的映射。[官方文档](https://docs.kernel.org/mm/page_tables.html)
- [S3] Remzi H. Arpaci-Dusseau 与 Andrea C. Arpaci-Dusseau，《Operating Systems: Three Easy Pieces》，文件、目录与文件系统章节。[章节 PDF](https://pages.cs.wisc.edu/~remzi/OSTEP/file-intro.pdf)
:::

:::en
- [S1] Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*, Chapter 13, “Address Spaces.” [Chapter PDF](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf)
- [S2] Linux Kernel Documentation, “Page Tables,” mapping process virtual addresses to physical pages. [Official documentation](https://docs.kernel.org/mm/page_tables.html)
- [S3] Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*, chapters on files, directories, and file systems. [Chapter PDF](https://pages.cs.wisc.edu/~remzi/OSTEP/file-intro.pdf)
:::
