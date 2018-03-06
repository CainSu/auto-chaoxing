export enum IsDragParam {
    onPlayProgress = 0,
    onStartOrPlay = 3,
    onEnd = 4,
    onPause = 2
}
export enum EndState {
    NotEnding = 1,
    Ending = 2
}

export enum Messages {
    ALL_VIDEOS_ARE_DONE,
    VIDEO_HAS_DONE,
    GOTO_NEXT_CHAPTER,
    UNFINISHED_QUIZ,
    FINISHED_QUIZ,
    GOTO_NEXT_TAB,
    UNHIT_PAGE = "未命中的页面"
}

export function makeid(possible = "abcdef0123456789", length = 5) {
    var text = "";

    for (var i = 0; i <= length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
export const id = makeid() + " Status: ";
