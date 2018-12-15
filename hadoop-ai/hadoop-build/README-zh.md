## 在docker容器中编译hadoop-ai 


```yaml

sudo docker build -t hadoop-build .

sudo docker run --rm --name=hadoop-build --volume=/hadoop-binary:/hadoop-binary hadoop-build

```

等待编译完成. 
你将在 ```/hadoop-binary```找到hadoop二进制文件
