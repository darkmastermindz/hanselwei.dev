<template>
  <div class="bitmojiAni">
    <img svg-inline class="icon" src="~/assets/hanselbitmoji.svg" alt="example" />
  </div>
</template>

<style>
.bitmojiAni {
  border-radius: 350px;
  box-sizing: border-box;
 
  background-image: linear-gradient(45deg,#fff 25%,red, 25.5%,lawngreen 50%,#fff 50.5%,white 75%,transparent 75.5%,red);
  background-size: 40px 40px;

  border: 7px red;
  display: inline-block;
  animation: turn 0.5s linear backwards 1.5s;
  transform: rotateY(720deg);
  position: relative;
  overflow: hidden;
  height: 230px;
  width: 230px;
}
</style>
