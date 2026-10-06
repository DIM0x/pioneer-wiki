:::zh
**加密、哈希与签名：三个不同的问题**梳理常被笼统称为“加密”的三类密码学工具。策展对应物为 *Batagur baska*，仅用于分类展示，不构成关于该物种行为的陈述。

## 定义与边界 | Definition and boundaries

加密以密钥把明文变为密文，目标是在满足算法和密钥条件时，让没有密钥的一方难以读出内容。哈希函数把任意长度消息映射为固定长度摘要；摘要适合检测变化或索引，但单独使用不隐藏消息，也不证明是谁生成了它。[C1] 数字签名则由私钥对消息或其规范编码产生签名，验证者用相应公钥检查签名是否匹配。签名为完整性和签名密钥持有者身份提供密码学证据；身份与公钥的真实绑定仍依赖证书、信任根或其他密钥分发机制。[C2]

这三者的保证不可互换。把密码做普通哈希并不等于安全地存储密码；把文件的哈希值和文件放在同一可改写位置，攻击者可以两者一起替换；用公钥加密也不会自动告诉接收方是谁发送的。设计时要先列出攻击者能够读取、修改、伪造或删除什么，再决定需要机密性、完整性、来源认证还是抗抵赖等属性。

## 工作机制 | How it works

对称加密由共享密钥完成加解密，适合处理大量数据；密钥必须通过受控途径产生、保存、轮换和撤销。现代应用通常选用带认证的加密模式，使密文同时携带完整性校验；解密端应拒绝校验失败的结果。非对称密码使用一对相关密钥，可用于签名或密钥协商。它们的职责仍需区分：密钥协商建立共享秘密，之后由对称算法加密数据；签名密钥应与加密密钥用途分离并受保护。

哈希摘要本身不含秘密密钥，适合用来比较内容是否变化。若验证者需要确认消息来自持有秘密密钥的一方，可以用消息认证码（MAC）；若需要第三方使用公开材料验证来源，可考虑数字签名。选择成熟库和标准协议通常比自行拼装算法更可靠，但还必须定义输入编码、版本、随机数、密钥标识和错误处理，否则同一数据可能被不同端解释成不同消息。

## 一个例子 | A worked example

一个下载服务发布 `release.tar`。HTTPS 传输可以保护客户端与服务之间的链路，但不能单独证明一个离线镜像是否来自发布者。发布者可对明确编码的版本清单及文件摘要签名；客户端先验证签名对应的发布者公钥，再核对本地文件摘要。若要保存用户密码，则不应采用可逆加密，而应使用专为密码存储设计、带盐且可调成本的密码哈希方案。若要保护备份机密性，则使用受认证的加密和独立管理的密钥。每一步解决的都是不同威胁，不能用“用了 SHA-256”概括全部安全性。[C3]

## 局限与误解 | Limits and misconceptions

密码算法只能按其威胁模型提供保证。加密密钥泄漏、终端被入侵、错误的随机数、忽略认证标签、密钥轮换失败或不一致的序列化，都可能让理论上的安全性落空。哈希的抗碰撞属性不等于对低熵密码的抗猜测能力；普通哈希对常见密码可被快速离线枚举。签名也不能证明签名者的法律身份或意图，除非公钥绑定、签署内容和密钥控制过程都可信。算法强度和密钥长度还需随标准更新与应用寿命重新评估。

## 相关标本 | Related specimens

参见[身份认证与授权](/entries/authentication-authorization)区分用户身份与权限决定，[数据最小化与访问控制](/entries/data-minimization)缩小泄露后的影响，并通过[威胁建模](/entries/threat-modeling)确定应防护的资产与攻击者能力。NIST 的哈希与签名标准分别支撑本文对摘要及签名功能的描述；OWASP 的存储指南补充了密钥管理与密码存储实践 [S1-S3]。
:::

:::en
**Encryption, Hashing and Signatures: Three Different Problems** distinguishes three tools that are often loosely called “encryption.” Its editorial taxonomic counterpart is *Batagur baska*, included only as a catalogue association and not as a claim about animal behaviour.

## 定义与边界 | Definition and boundaries

Encryption transforms plaintext into ciphertext with a key. Under the algorithm's assumptions and with suitable key handling, a party without the key should find the protected content infeasible to recover. A cryptographic hash maps an input of arbitrary length to a fixed-length digest. Digests help detect changes or identify content, but a hash alone neither conceals the message nor proves who produced it [C1]. A digital signature is generated with a private key over a message or its defined encoding. A verifier uses the corresponding public key to check whether the signature matches. NIST describes digital signatures as a way to detect unauthorized modification and authenticate the identity associated with the signing key [C2]. That key-to-person association still depends on certificates, a trust root, or another trustworthy key-distribution process.

These guarantees are not interchangeable. A plain hash of a password is not secure password storage. If an attacker can replace both a file and its digest in the same writable location, the pair can be changed together. Public-key encryption does not by itself authenticate the sender. Start by listing what an attacker can read, alter, forge, or delete, then decide whether the system needs confidentiality, integrity, source authentication, or evidence that can be checked by a third party.

## 工作机制 | How it works

Symmetric encryption uses a shared secret for encryption and decryption and is efficient for bulk data. The system must generate, distribute, store, rotate, and revoke that key safely. Applications commonly use an authenticated-encryption mode so ciphertext also carries an integrity check; decryption must reject a failed check rather than expose untrusted plaintext. Public-key cryptography uses a related key pair and can support signatures or key establishment. These jobs remain distinct: key establishment creates shared secret material, which a symmetric cipher can then use to protect data; signing keys should have a separate purpose and controlled lifecycle.

A hash digest contains no secret key and is useful for comparing content. A message authentication code (MAC) lets parties sharing a secret verify message integrity and origin within that shared-key relationship. A digital signature allows verification with public material, which can be useful when recipients need to check a publisher's statement independently. Use maintained libraries and established protocols, while also specifying input encoding, versioning, nonce handling, key identifiers, and failure behaviour. Otherwise two systems may sign or verify different byte sequences even when people believe they are processing the same message.

## 一个例子 | A worked example

Suppose a service distributes `release.tar`. HTTPS protects the connection between a client and the server, but it does not by itself let a user verify an offline mirror. The publisher can sign a version manifest containing the file digest and release identity. A client first checks the signature against the publisher's trusted public key, then hashes the downloaded file and compares the result with the signed manifest. If the application stores user passwords, it should not use reversible encryption; it should use a password-storage scheme designed to make guessing expensive, with a salt and adjustable cost. If it protects backup confidentiality, it should use authenticated encryption and separately managed keys. Each choice addresses a different threat, so saying “we use SHA-256” cannot describe the security of the whole release process [C3].

## 局限与误解 | Limits and misconceptions

Algorithms provide guarantees only within their threat models. A leaked key, compromised endpoint, faulty randomness, ignored authentication tag, failed rotation, or inconsistent serialization can defeat an otherwise sound design. Collision resistance is not the same as resistance to guessing low-entropy passwords: ordinary fast hashes allow attackers to enumerate common choices offline. A signature does not establish a signer's legal identity or intent unless the key binding, signed content, and key-control process are trustworthy. Algorithm choices and key sizes also need review as standards change and as the expected lifetime of protected data becomes clear.

## 相关标本 | Related specimens

See [Authentication and Authorization](/entries/authentication-authorization) for the difference between identity and permission, [Data Minimization and Access Control](/entries/data-minimization) for reducing the consequences of exposure, and [Threat Modeling](/entries/threat-modeling) for defining assets and attacker capabilities. NIST's hash and signature standards support the distinctions above; OWASP's storage guidance adds practical advice on key management and password storage [S1-S3].
:::
