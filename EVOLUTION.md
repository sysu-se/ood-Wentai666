# EVOLUTION

## 1. 你如何实现提示功能？
我把提示能力落在领域对象上：
- `Sudoku.getCandidates(row, col)` 返回指定空格候选集合。
- `Sudoku.getCandidateHint()` 返回当前局面中一个“最值得提示”的空格及其候选。
- `Sudoku.getNextStepHint()` 返回可直接填写的单候选提示。
- `Game` 仅做转发，保持会话对象和领域对象职责分离。

## 2. 你认为提示更属于 Sudoku 还是 Game？为什么？
更属于 `Sudoku`。因为候选计算、冲突判断都来自棋盘规则本身，是领域逻辑。`Game` 负责流程编排（对外接口、状态和历史）。

## 3. 你如何实现探索模式？
在 `Game` 中增加 `exploreSession`：
- `enterExploreMode()` 建立探索会话快照。
- 探索期间 `guess/undo/redo` 走独立探索 history。
- `commitExplore()` 把探索基线并入主 history，并保留探索结果。
- `discardExplore()` 放弃探索，回到探索前快照。
- `rollbackExploreToStart()` 快速回到探索起点继续试其他分支。

## 4. 主局面与探索局面的关系是什么？
采用“快照复制 + 明确提交/放弃”模式，不共享可变对象引用：
- 进入探索时克隆当前 `Sudoku` 作为基线。
- 探索过程在当前会话对象上演进。
- 提交时仅把基线记入主 history；放弃时用基线恢复。
这样避免了深拷贝污染和引用串改。

## 5. history 结构在本次是否变化？
有变化：
- 主 history 仍是线性 `past/future`。
- 探索模式内有独立 `past/future`。
- 未引入树状全局 history（保持最小可行实现）。

## 6. Homework 1 哪些设计在 Homework 2 暴露局限？
- `Game` 仅有单一会话状态，难以容纳“临时探索分支”。
- Hint 若只在 UI 计算，会造成规则散落和重复实现。
- history 未区分会话语义时，探索提交/放弃难以自洽。

## 7. 如果重做 Homework 1 会如何修改？
- 提前为 `Game` 设计可扩展状态机入口（普通/探索）。
- 明确 `Sudoku` 的分析接口（候选、冲突、提示）作为稳定契约。
- history 抽象成可替换策略，减少后续探索功能改动面。
