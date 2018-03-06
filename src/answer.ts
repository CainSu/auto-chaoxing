type Basic<T extends "choose" | "judge" | "mult"> = {
    // 答案
    answer: string;
    // 题目
    title: string;
    // 问题类型
    type: T;
    // 没用的东西，可不填
    block: string[];
};
// 导出答案：
export type Answer = (
    | (Basic<"choose"> & {
          // Well, 选项所在的行的文本，然而的确也没用上
          option: string;
      })
    | Basic<"judge">
    | Basic<"mult">)[];
export default [] as Answer;
