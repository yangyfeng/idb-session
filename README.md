## 注意事项

1、当两个页面同时加载 idb-session 时，会出现当数据库遗失后，打开数据库时报错，导致```setItem()、getItem()```等操作失败。

解决方案: 

在页面跳转时执行的操作之前，调用 ```readyCreate```，让后续的操作可以重新创建数据库实例，就不会报错了。

代码案例：

``` 
// 跳转要做初始化准备
idbSession.readyCreate()
await idbSession.setItem(key, result)
window.open(href)
```