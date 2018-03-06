import { EndState, IsDragParam } from "./const";
import md5 from "md5";

export const now = () => Math.floor(new Date().getTime() / 1000);
export const fetchx: typeof fetch = (
    input: RequestInfo,
    init?: RequestInit
) => {
    if (!init) init = { credentials: "include" };
    return fetch(input, init);
};
export function sleep(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

//#region 发送播放 Log
export interface LogData {
    clazzId: string | number;
    objectId: string;
    duration: number;
    userid: string | number;
    jobid: string | number;
    clipTime: string;
    isSendLog?: number;
    dtoken?: string;
}
/** 源码中 onSendlog 的逻辑
 * @Referer https://mooc1-2.chaoxing.com/ananas/modules/video/index.html?v=2018-0126-1905
 * @see ExternalComp.as:189
 */
export function onSendlog(
    logdata: LogData,
    isdrag: IsDragParam,
    playingTime: number
) {
    let url = "";
    logdata.isSendLog = 1;
    for (const key in logdata) {
        if (key != "dtoken") {
            url = url + ("&" + key + "=" + logdata[key]);
        }
    }
    url = url + "&view=pc&playingTime=" + playingTime;
    url = url + "&isdrag=" + isdrag;
    const enc = md5(
        "[" +
            logdata.clazzId +
            "]" +
            "[" +
            logdata.userid +
            "]" +
            "[" +
            logdata.jobid +
            "]" +
            "[" +
            logdata.objectId +
            "]" +
            "[" +
            playingTime * 1000 +
            "]" +
            "[d_yHJ!$pdA~5]" +
            "[" +
            logdata.duration * 1000 +
            "]" +
            "[" +
            logdata.clipTime +
            "]"
    );
    url = url + "&enc=" + enc;
    url = url.substring(1);
    return `/multimedia/log/${logdata.dtoken}?${url}`;
}
//#endregion

//#region 获取下个章节 id、未完成数量
export async function getCourseList(req: typeof fetch, chapterId: string) {
    const regexp = /nextChapterId:(\d+),unfinishCount:(\d+)/;

    const url = "/mycourse/studentstudycourselist?";
    const params = new URLSearchParams();
    const here = new URLSearchParams(location.hash);
    params.set("courseId", here.get("courseId"));
    params.set("chapterId", chapterId);
    params.set("clazzid", here.get("clazzid"));
    if (!here.get("courseId") || !here.get("clazzid")) {
        alert(
            "请到 src/utils.ts Line 82 和 84 手动替换你的 courseId 和 clazzid"
        );
        throw new Error("");
    }

    const text = await (await req(url + params.toString())).text();

    const data: { nextChapterId: string; unfinishCount: number } = eval(
        `(${text.match(
            /<input type="hidden" id="_studystate" value="({nextChapterId:.+,unfinishCount:.{1,7}})"\/>/
        )[1] || {}})`
    );
    const { nextChapterId, unfinishCount } = data;
    if (unfinishCount && nextChapterId) {
        const n = new Notification("还剩 " + unfinishCount + " 个章节未完成");
        setTimeout(() => n.close(), 2000);
        return data;
    }
    return null;
}
//#endregion
