# Streaming CSV encryption demo

## Steps

```sh
## install yarn and deps
npm i -g yarn
yarn install

## generate test.csv
yarn gen_csv

## ignite http server
yarn start

## open another shell, same dir
## test1 is encryption, test2 is decryption
yarn test1
yarn test2
```

## Default test csv

```csv
a,b,c,d,e,f,g,h,i,j
一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十,一二三四五六七八九十一二三四五六七八九十
```

1,000,000 rows, ~583 MB csv file

## Results

```
1,000,000 rows 43.774s
100,000 rows 4.451s
```
