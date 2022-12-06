<template>
  <div class="bitmojiAni">
    <img svg-inline class="icon" src="~/assets/hanselbitmoji.svg" alt="example" />
  </div>
</template>

<style>
.bitmojiAni {
  border-radius: 350px;
  box-sizing: border-box;
 
  background-image: linear-gradient(4deg,#fff 35%,red,25.5%,#7cfc00 50%,#fff 50.5%,#fff 75%,red 75.5%,yellowgreen);
  background-size: 40px 40px;
  
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }

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
