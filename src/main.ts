import { onSendlog, fetchx, sleep, getCourseList, now } from "./utils";
import { IsDragParam, Messages, id, makeid } from "./const";
import { fakeLogForVideo } from "./fake-for-video";
import _answer from "./answer";

const video = "iframe.ans-insertvideo-online";
function postMessage(message: {
    type: Messages;
    reason: string;
    [key: string]: any;
}) {
    window.top.postMessage(message, "*");
}
let lastCallToSwitchTab = now();
async function main() {
    try {
        await Notification.requestPermission();
    } catch {}
    if (location.href.includes("mycourse/studentstudy")) {
        window.top.addEventListener("message", async event => {
            const type = event.data.type;
            type &&
                console.log(id + "事件：", {
                    ...event.data,
                    type: Messages[type]
                });
            switch (type) {
                case Messages.ALL_VIDEOS_ARE_DONE:
                    postMessage({
                        type: Messages.GOTO_NEXT_TAB,
                        reason: Messages[type],
                        id: Math.random()
                    });
                    return;
                // 切换到下一个 Tab
                case Messages.GOTO_NEXT_TAB:
                    if (now() - lastCallToSwitchTab > 1.5) {
                        lastCallToSwitchTab = now();
                        console.log(id + "切换到下一 Tab");
                        const active = parseInt(
                            document
                                .querySelector(".tabtags .currents")
                                .id.match(/(\d+)/)[0]
                        );
                        const nextTab: HTMLElement = document.querySelector(
                            "#dct" + (active + 1)
                        );
                        if (nextTab) {
                            nextTab.click();
                        } else {
                            postMessage({
                                type: Messages.GOTO_NEXT_CHAPTER,
                                reason: Messages[type]
                            });
                        }
                    }

                    return;
                // 进入下一章节
                case Messages.GOTO_NEXT_CHAPTER:
                    console.log(id + "切换到下一章节");
                    const search = new URLSearchParams(location.search);
                    const next = await getCourseList(
                        fetchx,
                        search.get("chapterId")
                    );
                    if (next === null) {
                        new Notification("章节切换错误", {
                            body: "请返回网页手动点击下一章"
                        });
                    }
                    search.set("chapterId", next.nextChapterId);
                    location.href =
                        location.origin +
                        location.pathname +
                        "?" +
                        search.toString();
                    return;
                case Messages.FINISHED_QUIZ:
                    console.log(id + "答题完成");
                    postMessage({
                        type: Messages.GOTO_NEXT_TAB,
                        reason: Messages[type]
                    });
                    return;
                default:
                    return;
            }
        });
    } else if (location.href.includes("ananas/modules/video/index.html?")) {
        console.log(id + "视频页");

        /** Flash 可能没有立刻被加载 */
        function FlashIsLoaded() {
            return new Promise<HTMLObjectElement[]>(resolve => {
                const t = setInterval(() => {
                    const doc = document.getElementsByTagName("object");
                    if (doc.length) {
                        clearInterval(t);
                        resolve([...doc]);
                    }
                }, 500);
            });
        }

        for (const ele of await FlashIsLoaded()) {
            const flashVarsCont = [...ele.children].filter(
                x => x.getAttribute("name") === "flashvars"
            )[0];
            if (!flashVarsCont) {
                console.warn(id + "发现没有 FlashVars 的 object", ele);
                continue;
            }
            const flashVars = flashVarsCont.getAttribute("value");

            const parsedFlashVars = new URLSearchParams(flashVars);
            const exampleLogParam = {
                isSendLog: 1,
                clazzId: 123,
                duration: 123,
                jobid: "",
                objectId: "",
                otherInfo: "",
                rt: 0.9,
                dtype: "",
                clipTime: "",
                dtoken: "",
                userid: ""
            };
            const logParam: typeof exampleLogParam = JSON.parse(
                parsedFlashVars.get("logParam")
            );
            console.log(id + "开始模拟视频");
            await fakeLogForVideo(logParam, fetchx);
            console.log(id + "视频已经完成");
        }
        postMessage({
            type: Messages.VIDEO_HAS_DONE,
            reason: "videos are finished"
        });
    } else if (location.href.includes("work/doHomeWorkNew")) {
        postMessage({
            type: Messages.UNFINISHED_QUIZ,
            reason: "loaded unfinished"
        });

        const nots: Notification[] = [];
        addEventListener("beforeunload", () => nots.map(x => x.close()));
        /* 是否自动提交 */
        let autoSubmit = true;
        const question = [...document.querySelectorAll(".TiMu")]
            .map(x => x.cloneNode(true))
            .map((x: HTMLDivElement) => {
                x.querySelectorAll(".TiMu").forEach(x => x.remove());
                return x;
            })
            .map(x => {
                const enum Type {
                    单选题 = 0,
                    判断题 = 3
                }
                const type = x
                    .querySelector("input[type=hidden]")
                    .getAttribute("value");
                switch (parseInt(type)) {
                    case Type.判断题:
                    case Type.单选题:
                        const opts = [
                            ...x.querySelectorAll("input[type=radio]")
                        ] as HTMLInputElement[];
                        return {
                            title: (x.querySelector(
                                "div.Zy_TItle > div"
                            ) as HTMLElement).innerText,
                            name: opts[0].name,
                            options: opts.map(x => x.value)
                        };
                    default:
                        autoSubmit = false;
                        nots.push(
                            new Notification("有无法自动完成的题目", {
                                body: "请手动答题，提交后将自动继续进度",
                                requireInteraction: true
                            } as any)
                        );
                        return null;
                }
            })
            .filter(x => x);
        console.log(id + "题目 ", question);
        function findAnswer(x: typeof question[0]) {
            const answer = _answer.filter(y => y.title.includes(x.title));
            const allChoosing = [
                ...document.getElementsByName(x.name)
            ] as HTMLInputElement[];
            if (!answer[0]) {
                answer[0] = {
                    answer: allChoosing.sort(x => Math.random() + 0.5)[0].value,
                    title: x.title,
                    type: "judge",
                    block: []
                };
            }
            if (answer[0].type === "mult") {
                autoSubmit = false;
                nots.push(
                    new Notification(x.title, {
                        body: `这是一道多选题，请手动选择，答案已经在控制台里`
                    })
                );
                console.log(id + "答案：", answer[0]);
                return;
            }
            const choosing = allChoosing.filter(
                (x: HTMLInputElement) =>
                    x.value.toLowerCase() === answer[0].answer.toLowerCase()
            );
            if (choosing.length === 0) {
                autoSubmit = false;
                nots.push(
                    new Notification(x.title, {
                        body: `请手动作答`
                    })
                );
            } else {
                choosing[0].click();
            }
        }
        for (const que of question) {
            await sleep(10 * Math.min(Math.random(), 0.5));
            findAnswer(que);
        }
        if (autoSubmit) {
            console.log(id + "自动点击提交");
            (document.querySelector(
                '[onclick="btnBlueSubmit();"]'
            ) as HTMLDivElement).click();
            await sleep(10 * Math.min(Math.random(), 0.5));
            const submit = document.querySelector(
                '[onclick="form1submit();"]'
            ) as HTMLDivElement;
            if (
                (document.querySelector("#tipContent") as HTMLDivElement)
                    .innerText === "确认提交？" &&
                submit.offsetParent !== null
            ) {
                console.log(id + "自动点击确认");
                submit.click();
            } else {
                console.log(id + "自动点击提交失败");
                nots.push(
                    new Notification("自动提交失败", { body: "请手工处理提交" })
                );
            }
        }
    } else if (location.href.includes("work/selectWorkQuestionYiPiYue")) {
        postMessage({
            type: Messages.FINISHED_QUIZ,
            reason: "loaded finished"
        });
    } else if (location.href.includes("knowledge/cards")) {
        setTimeout(() => {
            if (!document.getElementsByTagName("iframe").length) {
                postMessage({
                    type: Messages.GOTO_NEXT_TAB,
                    reason: "no iframe found"
                });
            }
        }, 6000);
        const videos = [
            ...document.querySelectorAll(video)
        ] as HTMLIFrameElement[];
        if (videos.length) {
            let count = 0;
            let resolve,
                all_videos = new Promise((res, rej) => {
                    resolve = res;
                });
            window.top.addEventListener("message", e => {
                if (e.data.type === Messages.VIDEO_HAS_DONE) {
                    count += 1;
                    if (count >= videos.length) {
                        resolve();
                    }
                }
            });
            await all_videos;
            postMessage({
                type: Messages.ALL_VIDEOS_ARE_DONE,
                reason: "all videos done"
            });
        }
    } else {
        postMessage({
            type: Messages.UNHIT_PAGE,
            location: location.href,
            reason: "unknown page"
        });
    }
}
main().catch((e: Error) => {
    console.error(id + "错误: ", e);
});
