## 数据库设计

### T_Novel 小说表

|  字段          |   类型      |  可为空  |  默认值    |  说明     |
| ------------- |  --------:  | :-----: | :-------: | :------: |
|  id           |  INTEGER    |  否     |  自增Id    |  小说ID   |
|  title        |  TEXT(500)  |  否     |           |  小说标题  |
|  url          |  TEXT(500)  |  否     |           |  小说地址  |
|  createTime   |  TEXT       |  否     |   当前时间  |  创建时间  |
|  updateTime   |  TEXT       |  否     |   当前时间  |  更新时间  |

### T_Content 章节内容表

|  字段            |   类型      |  可为空   |  默认值   |  说明                             |
| --------------- |  --------:  | :------: | :------: | :------------------------------: |
|  id             |  INTEGER    |  否      |  自增Id   |  章节ID                          |
|  parentId       |  INTEGER    |  否      |  自增Id   |  小说ID                          |
|  chapterNo      |  INTEGER    |  否      |          |  章节序号                         |
|  chapterTitle   |  TEXT(500)  |  否      |          |  章节标题                         |
|  url            |  TEXT(500)  |  否      |          |  章节地址                         |
|  content        |  TEXT       |  是      |          |  章节地址                         |
|  contentIsNull  |  INTEGER    |  否      |   1      |  内容是否为空，1为ture， 0 为false  |
|  createTime     |  TEXT       |  否      |  当前时间  |  创建时间                         |
|  updateTime     |  TEXT       |  否      |  当前时间  |  更新时间                         |