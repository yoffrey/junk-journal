---
title: Matinee stubs
date: 2026-06-14
medium: ticket stub collage
materials:
  - cinema tickets
  - popcorn box scrap
  - metro day pass
tags:
  - film
  - night
palette: midnight
objects:
  - id: letters
    type: letters
    text: SHOW
    x: 8
    y: 6
    width: 80
    rotate: -2
    z: 5
    page: left
    interact: []
  - id: ticket
    type: photo
    src: /pieces/ticket-matinee.svg
    frame: none
    x: 6
    y: 28
    width: 72
    rotate: -4
    z: 4
    page: left
    back: "sat in F12 and still whispered through the credits."
    interact: [drag, flip]
  - id: stub-stack
    type: waterfall
    srcs:
      - /pieces/ticket-stub.svg
      - /pieces/ticket-stub.svg
      - /pieces/metro-pass.svg
    x: 18
    y: 52
    width: 28
    rotate: 3
    z: 6
    page: left
    interact: [waterfall, drag]
  - id: note
    type: note
    text: matinee light · sticky floors · bus home humming
    x: 52
    y: 62
    width: 40
    rotate: 4
    z: 5
    page: left
    interact: [drag]
  - id: tape-stripe
    type: tape
    x: 12
    y: 24
    width: 30
    rotate: -12
    z: 7
    page: left
    color: stripe
    interact: []
  - id: popcorn
    type: photo
    src: /pieces/popcorn-box.svg
    frame: none
    x: 12
    y: 10
    width: 36
    rotate: -6
    z: 3
    page: right
    interact: [drag]
  - id: metro
    type: photo
    src: /pieces/metro-pass.svg
    frame: torn
    x: 48
    y: 16
    width: 42
    rotate: 5
    z: 4
    page: right
    interact: [drag]
  - id: stub
    type: photo
    src: /pieces/ticket-stub.svg
    frame: sticker
    x: 20
    y: 52
    width: 24
    rotate: -8
    z: 5
    page: right
    interact: [drag]
  - id: speech
    type: speech
    text: stay for the credits
    x: 48
    y: 58
    width: 40
    rotate: 2
    z: 7
    page: right
    interact: [drag]
  - id: star
    type: star
    x: 68
    y: 72
    width: 16
    rotate: 12
    z: 6
    page: right
    color: "#e63946"
    interact: [drag, stamp]
  - id: tape-stars
    type: tape
    x: 10
    y: 44
    width: 26
    rotate: 18
    z: 8
    page: right
    color: stars
    interact: []
---

Ink-dark pages for a daytime movie. Pull the stub stack — the metro pass hides underneath like a plot twist.
