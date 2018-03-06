import { LogData, sleep, onSendlog, now } from "./utils";
import { IsDragParam, id } from "./const";

export function fakeLogForVideo(data: LogData, req: typeof fetch) {
    const startFrom = now();
    return new Promise(async resolve => {
        const sendLog = async (isDrag: IsDragParam) => {
            const url = onSendlog(
                data,
                isDrag,
                Math.min(data.duration, now() - startFrom)
            );
            const json: { isPassed: boolean } = await (await req(url)).json();
            return json.isPassed;
        };
        if (await sendLog(IsDragParam.onStartOrPlay)) {
            console.log(id + "播放过的视频");
            await sleep(1.5);
            resolve();
            return;
        }
        // Call a finish log
        setTimeout(async () => {
            sendLog(IsDragParam.onEnd);
            console.log(id + "视频播放完毕");
            await sleep(1.5);
            resolve();
        }, data.duration * 1000);
        // Call a pause log
        while (data.duration + startFrom > now()) {
            console.log(
                id +
                    "离视频结束还有 " +
                    (data.duration + startFrom - now()) +
                    " 秒"
            );
            await sendLog(IsDragParam.onStartOrPlay);
            await sleep(Math.random() * 200);
        }
    });
}
