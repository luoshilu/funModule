# funModule
js模块化实现

- 符合AMD标准
- 支持自定义配置
- 支持循环依赖

## usage

html:
```
// index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>funModule</title>
    <script src="./dist/funM.js"></script>
</head>
<body>
    <script>
        require(['a.js'], function (a) {
            console.log(a);
        })
    </script>
</body>
</html>
```
```
// a.js
define(function(){
    return 'im a return'
})
```

