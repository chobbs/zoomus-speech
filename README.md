# Zoom Meeting Context Terms

## Motivation

This is a simple example combining the Zoom.us API and Google Speech API. Small example to demonstrate to
extract sales taxonomy terms from a Zoom cloud meeting recording for the context of the call.


```js

Sample Frequency Output

Fetching Zoom Cloud Recording Object
Downloaded Zoom.mp4 meeting file
Converting (.mp4)-to-(.wav) file
Codec processing finished, writing local file
Google-Speech API => Extracting Sales-Taxonomy:

Meeting Topic: Sales Call  , Meeting Start: 2018-04-19T19:39:27Z , Meeting Duration: 1min(s)
2: price
1: cost
1: demo
0: legal
0: procurment
3: blocker
0: value

```