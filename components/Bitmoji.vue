<template>
  <div class="bitmojiAni">
    <img svg-inline class="icon" src="~/assets/hanselbitmoji.svg" alt="hansel's profile picture" />
  </div>
</template>

<style>
.bitmojiAni {
  border-radius: 350px;
  box-sizing: border-box;
 
  background-image: linear-gradient(11893deg,#fff 22%,#653496,23%,#7cfc00 77%,#fff 50.5%,#fff 77%,#653496 77%,#7B52AE);
  background-size: 40px 40px;
  
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1);

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .77;
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
