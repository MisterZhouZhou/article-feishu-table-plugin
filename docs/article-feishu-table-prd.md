# 插件功能
## 插件配置页面
1.  提供一个**独立的Chrome扩展选项页面 (options_page)**，用于保存飞书应用所需的配置信息，包括：
    * 飞书应用id
    * 飞书应用Secret
    * 飞书多维表格app_token
    * 飞书多维表格table_id
2.  配置信息将以**明文**形式存储在浏览器本地存储中，**仅支持单用户配置**。
3.  点击保存按钮后，插件会保存配置信息，**更改将立即生效**，无需重启插件。下次打开配置页面时，会读取已保存的配置并填充表单，支持二次编辑。

## 文章列表页面
1.  顶部有三个按钮：添加当前文章、刷新文章列表、配置插件。
    *   **添加当前文章按钮**：
        *   点击添加按钮会获取当前页面的文章链接。
        *   调用飞书应用API，将文章链接添加到飞书多维表格的 `链接` 字段中。
        *   **去重处理**：如果该链接已存在于表格中，应提示用户"文章已存在"，不进行重复添加。
    *   **刷新文章列表按钮**：点击刷新按钮会调用飞书应用API，获取飞书多维表格中的文章链接、`标题`、`概要内容输出` 字段，并更新插件中的文章列表。
    *   **配置插件按钮**：点击配置插件按钮会打开插件的选项页面。
2.  顶部按钮下方是一个列表，用于展示从飞书多维表格获取的文章。
    *   列表每一行是一个文章卡片，卡片展示文章的 `标题`、`概要内容输出` (文章概要) 和 "查看原文" 按钮。
    *   点击 "查看原文" 按钮，会在浏览器新标签页打开对应的 `链接`。
    *   列表默认每页显示5条文章卡片。
    *   当文章数量超过5条时，列表底部将提供**分页控件**，允许用户切换页面查看更多文章。
3.  打开插件时（例如点击浏览器工具栏的插件图标），会自动调用飞书应用API，获取第一页的文章数据并展示在列表中。
4.  **搜索与筛选**：初期版本暂不提供文章列表的搜索或筛选功能。

## 飞书应用API接口配置
*   **凭证有效期**: 飞书应用Secret和多维表格相关配置信息被视为长期有效，插件本身不处理凭证自动刷新或过期问题。
*   **错误处理**: 当调用飞书API失败时（例如网络错误、配置错误、权限问题等），应在插件界面给出用户友好的错误提示信息（例如："加载失败，请检查网络或配置"）。初期版本暂不实现详细的错误日志记录功能。
*   查询接口示例
```
curl -i -X POST 'https://open.feishu.cn/open-apis/bitable/v1/apps/PWCjbSYSMaKt6VsxZkscaNxEnub/tables/tbl7dxnpUeYDJyvx/records/search?page_size=20&page_token=1' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer 飞书应用tenant_access_token' \
-d '{
        "sort": [
                {
                        "desc": true,
                        "field_name": "排序"
                }
        ]
}'
```
响应数据
```
{
  "code": 0,
  "data": {
    "has_more": false,
    "items": [
      {
        "fields": {
          "全文内容提取": [
            {
              "text": "以下是提取的微信文章的完整内容：\n\n---\n\n**标题**: Manus，为何是他们做出来了？\n\n**作者**: Super黄\n\n**描述**: 春天到来了！会百花齐放么？\n\n**内容**:\n故事从去年10月26日说起，在那天，黄叔非常喜欢的Arc浏览器被创始人Josh Miller决定战略性放弃，开始开发新的AI Agent浏览器Dia：同一天，HideCloud和Peak刚从武汉飞回北京，落地后，HideCloud震惊的发现，打开手机刷的第一条推特就是上面这条，因为，此前的两天，他们在武汉决定了终止AI浏览器的研发工作，莫名其妙的中美两只团队在同一刻达成了共识。\n\n为何放弃AI浏览器？其实去年做AI浏览器还是挺容易理解的决定，Arc也是2023年Product Hunt年度产品的第二名（第一是GPT4）：但是在实践中，团队发现个AI浏览器有一些问题，首先是浏览器是给单用户用的，那一旦AI要开始干活，咱们就只能眼睁睁的看着它，变成AI要和我们抢浏览器用了，这肯定不对。对的应该是：AI需要用浏览器，但不是在浏览器里面用，AI Should use browser，not in browser，那在哪用呢？在云端用！The browser should be in cloud。\n\n所以我们现在看Manus，会发现右侧AI在自己操控浏览器：在做AI浏览器的过程中，团队主营业务自己也基于很多场景做Post-training，在这个过程中发现基座模型越来越强大，其中有一个非常重要的信号："Less structure，more intelligence"这句话很重要，对内构成了整个团队的凝聚力，让Manus团队顶过了过去的三个月，最终把它做了出来，也是Manus和其他产品不一样的关键：Manus尽量减少人工对模型的控制，只需要做好铺垫，让AI自己发挥，反过来让AI教我们做人。（这句话在Manus官网的底部）\n\n这样，只需要基础模型能力提升，数据增加，很多能力会自然演化出来，不需要通过workflow的方式强行教会AI。这个非常反常识，也确实因为这样，初期很多投资人看完演示后会问：你们团队有多少人做workflow？Manus的团队会说：没人，是模型自己做的！结果投资人都不相信。但这是Manus的底层信仰！也是AI Agent Manus诞生的契机！\n\n在这个信仰之上，做好Manus，需要给它三个东西：\n1. **Give it a computer**：就像招一个员工，入职就得给他配电脑，不然他没法办公呀！电脑有了，权限也给配上！\n2. **Give it data access**：有了电脑，还要让他能上网，能看公司的知识库，于是给接入了大量的私有API，这样才能获得权威的结构化的数据，后面才能处理。\n3. **Give it some training**：再做一个入职培训，包括有个mentor带着（对Manus来说就是我们用户啦），时不时给它反馈！\n\n这样，Manus就可以开始干活了，随着在我们手下打工，还能持续进化！简单说完上面的故事后，为何Manus是这个团队率先做出来了？这就是天时地利人和了。\n\n天时：前面说了，整个公司在做产品过程中，发现了一个很关键的非共识："Less structure，more intelligence"，这里很重要的是：模型的intelligence开始进化到了可以做Agent的阶段！这是技术成熟度，开始和市场需求可以进行契合的时间点！\n\n地利：此前正好做AI浏览器，很多前置探索都已经积累下来了，包括整个初创公司很扁平，决策可以很快贯彻下来，资源协调非常快！\n\n人和：这个我感受最深刻，HideCloud和Peak两人在分享时配合非常默契，经常有无声的配合，这种有共同目标，一起冲刺的团队真的令人羡慕！不光配合默契，两人的能力也到了能驾驭这款产品的水准，1+1>2。\n\n诚然，现在的Manus还是个preview的版本，确实不建议对它抱有过于乐观的预期，Manus团队也坦言有很多工作可以优化，但每一次Manus还是会惊艳到大家。黄叔的测试里，看到它确实会用多模态看完视频，基于画面分析后给出正确答案，海辛分享的一个案例，在找一个转绘的教程的时候，Manus看着看着网页就点了举报。\n\n对于深度搜索，可以直接生成带交互的网页，让人印象深刻：也会发现不少失败的案例，比如下面这个Manus提示需要登录Youtube，但我接管后操作被Youtube提示需要换浏览器，我和Manus说过后，它无法实现这个操作，最后用观看视频的描述文字做总结，变通的完成了任务。也有让生成文字游戏无法实现预期目标，多次修复陷入死循环的case：回到Manus发布的当晚，黄叔陷入了一种虚无的情绪：如果Manus真的这么牛，那AI编程还有价值么？现场我问了Peak，他很肯定的告诉我，价值很大！\n\n再到今天，这件事情也很清晰了，在底模能力没有显著突破的前提下，Agent类产品可以达到的边界，还是可以预期的，Manus离真正的通用Agent还有距离，但依然很惊艳！2025年，很值得期待。\n\n说几个花絮，今天黄叔受邀到北京线下参加了人数极少的交流会，原定10点半开始的活动，我9点半就到了，于是我提前见了两位核心成员：HideCloud和Peak。HideCloud说，昨晚3点半才回酒店，回去的时候手机电量说80%，早上起来手机被震动到没电。。。我问Peak产品发布后兴奋不？他说比起兴奋，现在更多是疲惫。确实最近太辛苦了！\n\n现场是在一个类似于K歌房的多功能会议室里进行的，确实非常的小，最后总共到场的就几个人，都是Manus团队的朋友，黄叔在受邀之列也是与有荣焉：开场时，两位引领了25年Agent创新的精神小伙，摆出了姿态：和老朋友们聊聊。最后回应一下争议：没有给媒体费，都是朋友，是自来水。\n\n--- \n\n以上是文章的完整内容。",
              "type": "text"
            }
          ],
          "排序": "4",
          "标题": [
            {
              "text": "Manus，为何是他们做出来了？",
              "type": "text"
            }
          ],
          "概要内容输出": {
            "type": 1,
            "value": [
              {
                "text": "Manus是由中国团队Monica.im开发的通用型AI Agent，其核心突破在于采用"Less structure, more intelligence"理念，减少人工干预，依赖基座模型自主进化能力完成复杂任务[1][5][9]。其诞生背景与关键创新点如下：\n\n1. **放弃AI浏览器的转型**  \n团队原研发AI浏览器时发现用户与AI存在操作冲突，转而将浏览器置于云端，让AI通过云端自主调用浏览器资源，实现任务自动化。\n\n2. **核心实现逻辑**  \n- **基础设施**：赋予AI计算机权限、结构化数据接口及用户反馈机制；  \n- **技术路径**：基于大模型能力演化，而非预设流程（反常规的"零workflow"设计让初期投资人难以理解）[1][5]；  \n- **进化机制**：通过用户持续反馈优化，如处理多模态视频分析、动态生成交互网页等场景[1][9]。\n\n3. **成功要素**  \n- **天时**：模型智能度达到Agent应用阈值；  \n- **地利**：AI浏览器研发积累技术基础；  \n- **人和**：HideCloud与Peak等高默契核心团队快速决策执行。\n\n4. **现状与争议**  \n当前版本虽展现自动筛选简历、分析股票等惊艳案例，但仍存在操作死循环等问题。部分声音认为其本质是现有技术的应用创新，非底层突破[5][9]，但作为首款实现"用户需求→全自动闭环"的通用Agent，已引发行业高度关注[1][8]。\n\n[1] 一个邀请码卖到上万，昨晚爆火的Manus真有这么牛?  \n[5] 壳有壳的用处，Manus或许是不错的 Agent，但够不上刷屏的追捧  \n[8] 拒绝再被带节奏，这4点内容帮助你全面了解关于Manus的基本问题  \n[9] 锐评|要热潮不要热炒，多给"Manus"们一点时间",
                "type": "text"
              }
            ]
          },
          "链接": {
            "link": "https://mp.weixin.qq.com/s/03zViuEAMo7XofG1rvZr5g",
            "text": "https://mp.weixin.qq.com/s/03zViuEAMo7XofG1rvZr5g"
          }
        },
        "record_id": "recuKNdTlITYbB"
      },
      {
        "fields": {
          "全文内容提取": [
            {
              "text": "根据提供的内容，以下是提取的全文内容：\n\n---\n\n**标题**：久谦伙伴｜对话PLAUD AI创始人-在北美卖爆AI硬件\n\n**作者**：久谦中台\n\n**描述**：AI硬件产品创新成功之道\n\n**内容**：\nPLAUD NOTE是一款由GPT驱动的AI智能录音设备，提供录音、语音转文字和内容总结的一站式解决方案，凭借其精准的PMF和技术优势，不到1年时间已在全球范围内积累了几十万的用户数量，在全球所有AI硬件中名列前茅，为中国出海AI硬件第一。\n\n我们与PLAUD AI CEO许高进行深度对话，从全球市场布局、产品开发思维到AI硬件的市场机会，全面解析PLAUD AI的成功经验，探讨了AI硬件产品创新的成功之道。\n\n**核心观点**：\n- AI录音笔在全球市场有很大的潜力，是大厂忽视的细分赛道，小公司可以通过创新占据市场。\n- 录音笔是大厂看不上，小公司搞不定的细分赛道，AI录音笔需要硬件、软件和AI的研发，有一定技术壁垒。\n- 产品要有软件和AI的深度融合：产品体验可通过OTA方式增强，可获取用户体验数据以改进产品，容易实行订阅制的商业模式。\n- GPT技术的出现完美匹配了AI录音笔的需求，AI产品会不可逆地去替代不带AI的产品，就像TWS去替代有线耳机一样。\n- AI硬件产品的成功取决于其产品体验和市场定位，从第一性原理出发，考虑消费者需求和体验。\n\n**对话内容**：\n- **久谦**：Plaud是一款非常成功的产品，热度和实际销量都排在非常靠前的位置，想先请您简单介绍一下您当初是怎么看到这个机会，以及在这个机会落地的过程当中您观察到哪些坑。\n- **许高**：我们选择赛道和切入点的依据：第一个是全球市场加中国的不管是供应链、还是一些技术上的优势都有很大潜力。相比在中国市场内部内卷，全球化是一个巨大的机会。\n\n（后续对话内容省略）\n\n---\n\n以上是提取的文章内容的摘要和核心观点。如果需要更详细的信息或特定部分的内容，请告知！",
              "type": "text"
            }
          ],
          "排序": "2",
          "标题": [
            {
              "text": "久谦伙伴｜对话PLAUD AI创始人-在北美卖爆AI硬件",
              "type": "text"
            }
          ],
          "概要内容输出": {
            "type": 1,
            "value": [
              {
                "text": "PLAUD AI凭借其AI智能录音设备PLAUD NOTE在北美市场快速崛起，成为全球AI硬件领域头部品牌。其成功经验可总结为以下四点：  \n1. **精准市场定位**：瞄准大厂忽视的细分赛道——AI录音笔，结合全球市场需求与中国供应链及技术优势，避免国内内卷竞争[1]。  \n2. **技术壁垒构建**：通过硬件、软件与AI深度整合（如OTA升级优化体验、订阅制商业模式），形成差异化竞争力，满足用户录音转文字、内容总结等一站式需求。  \n3. **GPT技术赋能**：利用GPT技术提升内容处理效率，推动AI产品对传统硬件的不可逆替代，类比TWS耳机取代有线耳机的趋势。  \n4. **产品开发逻辑**：从第一性原理出发，以用户体验为核心，通过数据反馈持续迭代，强化产品与市场的匹配度（PMF）。  \n\nPLAUD NOTE一年内积累数十万用户，验证了AI硬件在细分赛道的商业化潜力，也为中国出海企业提供了"技术+全球化"的创新范本。  \n\n[1] 万字探讨:AI硬件的突围方向和可能性未来 - 智源社区",
                "type": "text"
              }
            ]
          },
          "链接": {
            "link": "https://mp.weixin.qq.com/s/nLFoKOcT8l5WtwE3XzxsIw",
            "text": "久谦伙伴｜对话PLAUD AI创始人-在北美卖爆AI硬件"
          }
        },
        "record_id": "recuKH2xftKdAa"
      },
      {
        "fields": {
          "全文内容提取": [
            {
              "text": "文章标题：王者回归！Chatgpt炸裂更新！图片生成控制秒杀全场！本文附带彩蛋！不看就亏了！\n\n原创：金先森是朝鲜族阿  \n时间：2025年03月26日 14:58 北京\n\n引言：  \n关注老金的小伙伴都清楚，老金一直是Chatgpt的死忠粉。因为它是老金第一个接触到的，让我发出"卧槽！"的AI工具。从订阅开始就从来没断过的唯一产品，不过之前确实让老金我觉得，"哎，不如XXX，不如YYY"了。今天，它终于站起来了！更新了一个炸裂的存在！是老金至今为止用过的多模态生图里最好用的一个，没有之一！\n\n# 文末放个小彩蛋，希望你看完以后也能来一句"卧槽！"\n\n这里就能看见它更新了创建图片。先放个图给大家看看！它支持汉字，还很贴心的把狗的食物换成了骨头！\n\n正文：  \n技术解析：老金我来说说这个"绑定"能力。简单来说，就是AI图像生成器在属性和对象之间保持正确关系的能力。比如，你让AI生成一个有蓝色星星和红色三角形的图像，如果AI的"绑定"能力强，它就会正确地生成一个蓝色星星和红色三角形的图像，而不是一个红色星星。\n\n技术亮点：  \n这个系统采用的是自回归方法，从左到右、从上到下顺序生成图像，就像我们写文章一样。这种技术，使得图像上的文本渲染更加准确，避免了常见的小标题或文本元素有错别字或错误的情况。\n\n安全措施：防止滥用，保护你的权益  \n老金我要强调的是，OpenAI的这个新功能，可是有强大的安全措施的。它能够防止去除水印，阻止生成性深度伪造，并拒绝生成CSAM的请求。这就是说，你的权益是受到保护的。\n\n其他参考图均来自互联网，可以参考下使用方法。\n\n彩蛋揭秘：  \n老金本文是利用昨天的Cursor链接Dify自动化创建工作流？老金手把手教你！编写的。在昨天的抓网页->英译中基础上，又让Cursor加了个仿写功能。怎么样？炸裂吧？\n\n结语：  \nChatgpt的更新，大幅降低了AI绘画的创作门槛。但要记住，多模态目前还远远达不到ComfyUI的超强定制化水准。如果你对ComfyUI感兴趣，建议看看老金之前写的一些基础教程 - AI绘画教程列表。\n\n再次记住老金第一次学会的提示词，"让我们一步一步来"。每天进步一点点，足矣。\n\n谢谢你读我的文章。如果觉得不错，随手点个赞、在看、转发三连吧🙂 如果想第一时间收到推送，也可以给我个星标⭐～谢谢你看我的文章。扫码添加下方微信（备注AI），拉你加入AI学习交流群。\n\n金先森是朝鲜族阿  \n谢谢你的喜欢～",
              "type": "text"
            }
          ],
          "排序": "1",
          "标题": [
            {
              "text": "王者回归！Chatgpt炸裂更新！图片生成控制秒杀全场！本文附带彩蛋！不看就亏了！",
              "type": "text"
            }
          ],
          "概要内容输出": {
            "type": 1,
            "value": [
              {
                "text": "ChatGPT近日推出图像生成功能重大更新，核心要点如下[1][5]：\n\n1. **核心升级**  \n   - 集成GPT-4o多模态模型，开放免费使用，支持精准生成含文字的图像（如菜单、梗图），文本位置和内容可100%还原[1][5]；\n   - 新增多轮交互生成能力，可基于聊天上下文逐步调整图片风格和内容[1][4]。\n\n2. **技术亮点**  \n   - 采用自回归方法顺序生成图像，提升文本渲染准确性，避免错别字[1]；\n   - 整合"All Tools"超级入口，支持图片识别、联网、DALL·E绘图等多模态功能联动[4]。\n\n3. **使用门槛降低**  \n   - 免费用户每日可体验3次生成，生成速度约十几秒/张[1]；\n   - 支持垫图玩法，用户上传参考图即可生成相似风格的AI图像[4][6]。\n\n4. **安全与限制**  \n   - 内置防滥用机制，阻止深度伪造和非法内容生成[原文]；\n   - 仍存在图像要素幻觉、依赖知识库等局限[5]。\n\n彩蛋：作者结合Cursor和Dify工具实现自动化创作流程，降低内容生产门槛。\n\n[1] GPT-4o图像生成今起免费!奥特曼坐镇紧急发布  \n[4] ChatGPT再升级!5.0之前最强形态，简直言出法随! - 腾讯云开发者社区  \n[5] 文生图功能升级 ChatGPT追击-腾讯新闻  \n[6] ChatGPT文生图升级，AI头像制作更上一层楼!_ai_工具-功能",
                "type": "text"
              }
            ]
          },
          "链接": {
            "link": "https://mp.weixin.qq.com/s/OnFwqePShHdTpbyAV_ixrQ",
            "text": "https://mp.weixin.qq.com/s/OnFwqePShHdTpbyAV_ixrQ"
          }
        },
        "record_id": "recuKGqy4b6Lh4"
      }
    ],
    "total": 3
  },
  "msg": "success"
}
```

- 插入接口示例
```
curl -i -X POST 'https://open.feishu.cn/open-apis/bitable/v1/apps/PWCjbSYSMaKt6VsxZkscaNxEnub/tables/tbl7dxnpUeYDJyvx/records' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer 飞书应用tenant_access_token' \
-d '{
        "fields": {
                "链接": {
                        "link": "https://mp.weixin.qq.com/s/nLFoKOcT8l5WtwE3XzxsIw",
                        "text": "久谦伙伴｜对话PLAUD AI创始人-在北美卖爆AI硬件"
                }
        }
}'
```
- 获取tenant_access_token接口示例
```
HTTP URL: https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internalHTTP Method: POST
{
    "app_id": "飞书应用ID",
    "app_secret": "飞书应用Secret"
}

接口响应示例：
{
    "code": 0,
    "msg": "ok",
    "tenant_access_token": "tenant_access_token",
    "expire": 7200
}
```

## 视觉要求
*   使用Material Design 2.0规范进行设计，采用标准的Material Design颜色方案。
*   注重元素间的恰当间距，保持界面清爽。
*   界面元素（如按钮、卡片）使用精细打磨的圆角。
*   **语言**: 初期版本仅支持中文界面。
*   **品牌化**: 初期版本暂不集成特定的Logo或品牌颜色，也暂不支持深色模式。