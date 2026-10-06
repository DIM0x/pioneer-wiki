:::zh
**数据最小化与访问控制**说明系统为什么应只处理完成明确目的所必需的个人数据，并在此基础上限制谁可以访问。策展对应物为 *Cuora amboinensis*，只是目录分类关系，不暗示该物种的自然史行为。

## 定义与边界 | Definition and boundaries

数据最小化是一项贯穿数据生命周期的设计原则：收集、使用、共享和保存的数据应与具体目的相关且不过量。英国保留的 GDPR 版本第五条将“目的限制”和“数据最小化”列为不同原则：目的应明确、合法；数据则须相对于处理目的保持充分、相关并限于必要范围。[C1] 该网页展示的立法文本注明没有对欧盟原始采纳文本作修改。因此，最小化不是简单少填一个表单字段，也不是删掉所有数据。它要求团队能说明每个字段为何存在、由谁使用、何时失效，以及删除或聚合后是否仍能履行服务、法律或安全责任。

访问控制回答不同问题：某个主体是否能读取、改写或转交已经存在的数据。最小化降低系统持有的数据数量和细节，访问控制约束暴露面；二者结合可以降低误用、滥用或泄露的机会，却不能互相替代。一个系统即使限制了访问，也可能收集了根本不需要的敏感字段；反之，只保存少量数据仍须阻止未授权读取。

## 工作机制 | How it works

先描述处理目的和数据流，再逐字段建立清单：字段的来源、精度、用途、使用角色、接收方、保留期限和删除方式。检查是否可以用范围值代替精确值、用短期令牌代替长期标识、用聚合统计代替逐人记录，或在设备本地计算后只发送必要结果。对每个目的分别确认合法依据、透明告知、保留期限和访问权限。数据模型可把敏感级别与保留策略显式标注，再通过权限测试、日志抽查和删除作业检查实际执行情况。[C2]

最小化不能只发生在采集入口。日志、分析事件、崩溃报告、搜索索引、导出文件、备份和测试副本可能重新带入已排除的信息。删除请求也要考虑这些派生副本的可操作期限，并让备份过期或恢复时继续遵循删除状态。若用于训练或产品分析，团队应单独评估是否需要原始内容、可否去标识化，以及目的改变是否要求新的告知或依据。

## 一个例子 | A worked example

预约服务为了发送提醒，只需预约编号、联系方式、时段和通知偏好。如果原型还采集完整生日、精确住址和与预约无关的兴趣标签，团队应逐项说明必要性；不能仅以“未来也许有用”作为默认理由。可以将生日删除，住址改成服务区域，预约完成后按已定义期限删除联系方式，同时保留不含身份信息的履约数量统计。服务器端再按职责限制客服、排班和分析角色访问相应字段；导出和诊断日志应遵循相同约束。

验证可通过字段级数据盘点、假账户的访问矩阵、删除后查询与备份恢复检查，以及对日志样本的敏感值扫描完成。业务团队还应确认通知功能在字段删减后仍符合用户预期，且事故响应需要的证据没有被意外抹除。

## 局限与误解 | Limits and misconceptions

“少收集就自动合规”并不成立：合法依据、透明度、安全、准确性、用户权利和适用法规仍需分别处理。匿名化很难保证，假名化后的数据仍可能关联回个人。过度删减可能影响服务可达性、反欺诈、无障碍支持、问责或依法保存的记录。保留期限应有明晰依据，但不同记录的目的可能不同；不能使用一个期限覆盖所有数据，也不能在目的完成后无限保留。改变数据用途时要重新审视目的与影响，不能把原始同意默认为无边界授权。

## 相关标本 | Related specimens

参见[身份认证与授权](/entries/authentication-authorization)处理最小权限，[威胁建模](/entries/threat-modeling)识别数据暴露情境，以及[日志、指标与追踪](/entries/logs-metrics-traces)了解诊断需要和遥测的额外隐私风险。GDPR 第五条与 NIST 隐私框架可作为政策设计的起点；具体适用义务取决于司法辖区、主体和处理情境 [S1, S2]。
:::

:::en
**Data Minimization and Access Control** explains why a system should process only the personal data needed for a stated purpose and should limit who can reach that data. Its editorial taxonomic counterpart is *Cuora amboinensis*, a catalogue relationship only; this entry makes no claim about the species' natural history.

## 定义与边界 | Definition and boundaries

Data minimization is a design principle for the full data lifecycle: collection, use, sharing, and retention should stay relevant to a defined purpose and avoid unnecessary detail. Article 5 of the UK General Data Protection Regulation, the retained UK version of Regulation (EU) 2016/679, lists purpose limitation and data minimization as separate principles. Purposes must be specified, explicit, and legitimate; personal data must be adequate, relevant, and limited to what is necessary in relation to those purposes [C1]. The legislation page states that this text has not been changed from the original EU-adopted text. Minimization is therefore not just removing one field from a form, and it does not mean deleting every record. A team should be able to explain why each field exists, who uses it, when it is no longer needed, and whether deletion or aggregation remains compatible with service, legal, or security responsibilities.

Access control asks a different question: whether a particular subject may read, alter, or transfer data that already exists. Minimization reduces the amount and detail the system holds; access control limits exposure. Together they reduce opportunities for accidental or abusive use, but neither replaces the other. A tightly permissioned application may still collect sensitive fields it does not need. A system holding only a small dataset must still prevent unauthorized reads.

## 工作机制 | How it works

Begin by documenting the processing purpose and data flow. For each field, record its source, precision, purpose, roles that use it, recipients, retention period, and deletion method. Ask whether a range can replace an exact value, a short-lived token can replace a durable identifier, an aggregate can replace individual-level records, or a calculation can happen on the device so only its necessary result is sent. Evaluate the basis, notice, retention, and access permissions for each purpose separately. Explicit classifications in the data model can connect sensitivity to retention policy; permission tests, log samples, and deletion jobs can then show whether those rules are actually applied [C2].

Minimization must continue after data entry. Logs, analytics events, crash reports, search indexes, exports, backups, and test copies can reintroduce details that the primary form avoids. A deletion request also needs a workable policy for derived copies and for backups that expire or are restored later. For training or product analytics, assess separately whether raw content is needed, whether de-identification is adequate for the context, and whether a changed purpose requires new notice or another legal basis.

## 一个例子 | A worked example

A booking service needs a booking identifier, contact channel, time slot, and notification preference to send a reminder. If an early prototype also collects a full birth date, precise home address, and unrelated interest labels, the team should justify each field; “we may use it later” is not a sufficient default purpose. It could remove the birth date, replace the address with a service area, and delete contact details after a defined period once the booking is complete, while retaining an identity-free count of completed bookings. Server-side roles can then restrict customer support, scheduling, and analytics staff to the fields each function needs. Exports and diagnostic logs should follow the same constraints.

Validation can combine a field-level inventory, an access matrix using test accounts, a query after deletion, a backup-restore check, and a scan of log samples for sensitive values. The business team should also verify that the reduced data still supports the promised reminders and that incident-response evidence has not been removed accidentally.

## 局限与误解 | Limits and misconceptions

“Collect less and compliance is automatic” is false. Legal basis, transparency, security, accuracy, individual rights, and applicable regulations still require separate attention. Anonymization is difficult to guarantee; pseudonymized data may still be linked to a person. Removing too much can impair service accessibility, fraud prevention, accessibility support, accountability, or a record that must be retained by law. Retention periods need a clear basis, but different records may serve different purposes, so one period should not be applied blindly to every dataset. Data should not be retained indefinitely after its purpose ends. A new use also requires renewed assessment; initial consent should not be treated as permission for any future processing.

## 相关标本 | Related specimens

See [Authentication and Authorization](/entries/authentication-authorization) for least privilege, [Threat Modeling](/entries/threat-modeling) for mapping exposure scenarios, and [Logs, Metrics and Traces](/entries/logs-metrics-traces) for the diagnostic value and additional privacy risk of telemetry. GDPR Article 5 and the NIST Privacy Framework offer starting points for policy design; actual obligations depend on jurisdiction, subjects, and processing context [S1, S2].
:::
