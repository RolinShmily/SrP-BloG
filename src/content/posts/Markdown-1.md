---
title: 一些Markdown语法展示
published: 2025-07-26
description: "主要演示了一些Markdown语法的使用，每一条均有代码块进行源码展示"
image: "../assets/images/Timeline_1_01_00_02_42.jpg"
tags: [Markdown, Obsidian, HTML]
category: ""
draft: false
lang: ""
---

# 一级标题

## 二级标题

```markdown
# 一级标题

## 二级标题
```

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

```markdown
# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题
```

**粗体**
**粗体**

```markdown
**粗体**
**粗体**
```

_斜体_
_斜体_

```markdown
_斜体_
_斜体_
```

**_粗斜体_**
**_粗斜体_**

```markdown
**_粗斜体_**
**_粗斜体_**
```

- 项目 1
- 项目 2

* 项目 3
  - 子项目

- 项目 4
- 项目 5

```markdown
- 项目 1
- 项目 2

* 项目 3
  - 子项目

- 项目 4
- 项目 5
```

1. 列表 1
   子列表
2. 列表 2
3. 列表 3

```markdown
1. 列表 1
   子列表
2. 列表 2
3. 列表 3
```

~~中划线~~

```markdown
~~中划线~~
```

- [ ] 复选框（未完成）
  - [ ] 子任务复选框

* [x] 复选框（已完成）

```markdown
- [ ] 复选框（未完成）
  - [ ] 子任务复选框

* [x] 复选框（已完成）
```

[外链](https://obsidian.md/)

```markdown
[外链](https://obsidian.md/)
```

[这是一条有变量的链接][这里是变量名]

[这里是变量名]: https://obsidian.md/

```markdown
[这是一条有变量的链接][这里是变量名]

[这里是变量名]: https://obsidian.md/
```

![图片链接](https://obsidian.md/apple-touch-icon.png)

```markdown
![图片链接](https://obsidian.md/apple-touch-icon.png)
```

![这是一条有变量的图片][图片变量名]

[图片变量名]: https://obsidian.md/apple-touch-icon.png

```markdown
![这是一条有变量的图片][图片变量名]

[图片变量名]: https://obsidian.md/apple-touch-icon.png
```

---

上下各有一条分割线（各一行）

---

```markdown
---
上下各有一条分割线（各一行）
---
```

下面还是一条分割线（占三行）

---

```markdown
下面还是一条分割线（占三行）

---
```

依旧是三条分割线（各一行）

---

---

---

```markdown
依旧是三条分割线（各一行）

---

---

---
```

    hello,world! 这是一个代码块
    这是换行后的代码

```markdown
    hello,world! 这是一个代码块
    这是换行后的代码
```

```c
	printf("hello,world!"); //这还是一个代码块
```

- 上面代码块的实现：
  \`\`\`c
  printf("hello,world!"); //这还是一个代码块
  \`\`\`

引用单段代码：`hello,world!`

```markdown
引用单段代码：`hello,world!`
```

转义符`\`：这是一个双反斜杠\\\

```markdown
转义符`\`：这是一个双反斜杠\\\
```

> 这是一段引用文本

    这是换行的第二段引用

> 这是组合引用第一行
> 这是组合引用第二行

> 这是嵌套引用外层
>
> > 这是嵌套引用内层

```markdown
> 这是一段引用文本

    这是换行的第二段引用

> 这是组合引用第一行
> 这是组合引用第二行

> 这是嵌套引用外层
>
> > 这是嵌套引用内层
```

| 表头 1 | 表头 2 | 表头 3 |
| ------ | ------ | ------ |
| 表体 1 | 表体 2 | 表体 3 |
| 表体 4 | 表体 5 | 表体 6 |

上面是无对齐，下面是左中右对齐

| 表头 1 | 表头 2 | 表头 3 |
| :----- | :----: | -----: |
| 表体 1 | 表体 2 | 表体 3 |
| 表体 4 | 表体 5 | 表体 6 |

```markdown
| 表头 1 | 表头 2 | 表头 3 |
| ------ | ------ | ------ |
| 表体 1 | 表体 2 | 表体 3 |
| 表体 4 | 表体 5 | 表体 6 |

上面是无对齐，下面是左中右对齐

| 表头 1 | 表头 2 | 表头 3 |
| :----- | :----: | -----: |
| 表体 1 | 表体 2 | 表体 3 |
| 表体 4 | 表体 5 | 表体 6 |
```

<u>HTML 下划线</u>

```markdown
<u>HTML 下划线</u>
```

HTML`img`标签让照片变大：

<img style="width: 300px" src="https://obsidian.md/apple-touch-icon.png">

<hr>为这段内容上方添加分割线</hr>

<span style="color: orange">使用 css 改变字体颜色</span>

```markdown
<img style="width: 300px" src="https://obsidian.md/apple-touch-icon.png">

<hr>为这段内容上方添加分割线</hr>

<span style="color: orange">使用 css 改变字体颜色</span>
```

这里有两个视频：

<iframe
    src="https://player.bilibili.com/player.html?isOutside=true&aid=80433022&bvid=BV1GJ411x7h7&cid=137649199&p=0"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    width="640"
    height="480"
></iframe>

<iframe
	width="560"
	height="315"
	src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=SrfdRfdqp2FJyQTn" title="YouTube video player"
	 frameborder="0"
	 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
	 referrerpolicy="strict-origin-when-cross-origin"
	 allowfullscreen>
</iframe>

```markdown
<iframe
    src="https://player.bilibili.com/player.html?isOutside=true&aid=80433022&bvid=BV1GJ411x7h7&cid=137649199&p=0"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    width="640"
    height="480"
></iframe>

<iframe
	width="560"
	height="315"
	src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=SrfdRfdqp2FJyQTn" title="YouTube video player"
	 frameborder="0"
	 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
	 referrerpolicy="strict-origin-when-cross-origin"
	 allowfullscreen>
</iframe>
```

$$
这是一段公式, x+y=0
$$

这是一条公式 $x+y=1$

这是一个分数 $\frac{1}{2}$

这是一个根式 $\sqrt{2}$

这是一个 3 次根式 $\sqrt[3]{2}$

变量 $x_3$ 的平方为 $x^2_3$

变量 $y_{x_1}$ 的 $z_2$ 次方为 $y^{z_2}_{x_1}$

这是一个定积分 $\int_1^2xdx$

这是一个极限 $\lim_{n\rightarrow+\infty}\frac{1}{n + 1}$

这是一个向量 $\vec{a}$

这是一个算式 $1+2+3+\cdots+n$

这是一个范围 $1,2,3\ldots,n$

这是向量点乘 $\vec{a}\cdot\vec{b}$

这是从 1 至 n 的累加 $\sum_1^n$

```markdown
$$
这是一段公式, x+y=0
$$

这是一条公式 $x+y=1$

这是一个分数 $\frac{1}{2}$

这是一个根式 $\sqrt{2}$

这是一个 3 次根式 $\sqrt[3]{2}$

变量 $x_3$ 的平方为 $x^2_3$

变量 $y_{x_1}$ 的 $z_2$ 次方为 $y^{z_2}_{x_1}$

这是一个定积分 $\int_1^2xdx$

这是一个极限 $\lim_{n\rightarrow+\infty}\frac{1}{n + 1}$

这是一个向量 $\vec{a}$

这是一个算式 $1+2+3+\cdots+n$

这是一个范围 $1,2,3\ldots,n$

这是向量点乘 $\vec{a}\cdot\vec{b}$

这是从 1 至 n 的累加 $\sum_1^n$
```

这是亿些数学符号

|         代码          |           符号           |         描述          |
| :-------------------: | :----------------------: | :-------------------: |
|        \not=          |         $\not=$          |        不等于         |
|       \approx         |       $\approx$          |        约等于         |
|        \times         |        $\times$          |         乘号          |
|         \div          |          $\div$          |         除号          |
|         \leq          |          $\leq$          |       小于等于        |
|         \geq          |          $\geq$          |       大于等于        |
|         \pm           |         $\pm$            |        正负号         |
|         \sum          |          $\sum$          |   求和符号（累加）    |
|        \prod          |         $\prod$          |         累乘          |
|       \coprod         |       $\coprod$          |         累除          |
| \overline{a + b + c}  |  $\overline{a + b + c}$  |        平均值         |
|        \sin           |         $\sin$           |         正弦          |
|        \cos           |         $\cos$           |         余弦          |
|        \tan           |         $\tan$           |         正切          |
|        \cot           |         $\cot$           |         余切          |
|        \sec           |         $\sec$           |         正割          |
|        \csc           |         $\csc$           |         余割          |
|         \circ         |         $\circ$          |          度           |
|       \infty          |        $\infty$          |         无穷          |
|         \int          |         $\int$           |        定积分         |
|        \iint          |         $\iint$          |       双重积分        |
|       \iiint          |        $\iiint$          |       三重积分        |
|        \oint          |         $\oint$          |       曲线积分        |
|        x\prime        |        $x\prime$         |         求导          |
|         \lim          |         $\lim$           |         极限          |
|        \alpha         |         $\alpha$         |        阿尔法         |
|         \beta         |         $\beta$          |         贝塔          |
|        \gamma         |         $\gamma$         |         伽玛          |
|        \delta         |         $\delta$         |        德尔塔         |
|       \epsilon        |        $\epsilon$        |       艾普西龙        |
|          \eta         |          $\eta$          |         依塔          |
|        \theta         |         $\theta$         |         西塔          |
|          \pi          |          $\pi$           |           派          |
|        \omega         |         $\omega$         |        殴米伽         |
|         \rho          |          $\rho$          |          柔           |
|        \sigma         |         $\sigma$         |        西格玛         |
|          \mu          |          $\mu$           |          缪           |
|        \lambda        |        $\lambda$         |        拦姆达         |
|         \tau          |          $\tau$          |          滔           |
|         \psi          |          $\psi$          |         普赛          |
|         \phi          |          $\phi$          |         傅艾          |
|          \xi          |          $\xi$           |         柯西          |
|       \emptyset       |       $\emptyset$        |         空集          |
|         \in           |          $\in$           |         属于          |
|        \notin         |        $\notin$          |        不属于         |
|       \supset         |        $\supset$         |        真包含         |
|       \supseteq       |       $\supseteq$        |         包含          |
|       \bigcap         |        $\bigcap$         |         交集          |
|       \bigcup         |        $\bigcup$         |         并集          |
|         \log          |          $\log$          |       对数函数        |
|         \ln           |         $\ln$            | 以 e 为底的对数函数   |
|         \lg           |         $\lg$            | 以 10 为底的对数函数  |
