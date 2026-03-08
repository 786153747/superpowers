# spec 使用说明

这个目录是项目级规范入口。

## 先看哪份

- 做后端详细设计：看 `spec/backend/java/detail-design-template.md`
- 做前端详细设计：看 `spec/frontend/vue/detail-design-template.md`
- 做后端需求澄清：看 `spec/backend/java/requirement-clarification.md`
- 做前端需求澄清：看 `spec/frontend/vue/requirement-clarification.md`
- 做后端测试设计：看 `spec/backend/java/unit-testing.md`

## 详细设计落盘规则

- 详细设计不能只写在聊天里，必须保存到 `docs/plans/`
- 推荐命名：
  - `docs/plans/YYYY-MM-DD-<主题>-backend-detail-design.md`
  - `docs/plans/YYYY-MM-DD-<主题>-frontend-detail-design.md`
- 前后端都涉及时，分成两份文档写，不要混成一篇
- 按模板把这些内容写具体：背景、范围、受影响文件、接口、字段、规则、风险、验证方式
- 尽量说人话，别只写空泛结论
