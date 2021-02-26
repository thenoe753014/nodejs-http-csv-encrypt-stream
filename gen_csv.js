const h = `a,b,c,d,e,f,g,h,i,j`;

console.log(h + "\r");

for (let i = 0; i < 1000000; i++) {
  console.log(
    h
      .split(",")
      .map((s) => "一二三四五六七八九十一二三四五六七八九十")
      .join(",") + "\r"
  );
}
