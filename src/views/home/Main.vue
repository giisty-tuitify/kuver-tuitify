<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import vShader from './vShader.vert';
import sunsetCloudsShader from './sunsetClouds.frag';

import noiseTex from './noise-2.png';
import { reactive } from '@vue/reactivity';
import * as dat from 'dat.gui';
import { gsap } from "gsap";
import { onMounted } from '@vue/runtime-core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GLTFModel from '@/assets/placeholder-character.gltf?url'
var CharacterModel;
const scene = new THREE.Scene();
// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);
// const controls = new OrbitControls( camera, renderer.domElement );
// controls.update();


const clock = new THREE.Clock();
const texture = new THREE.TextureLoader().load(noiseTex);
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

texture.magFilter = THREE.LinearFilter;
texture.minFilter = THREE.LinearMipMapLinearFilter;
texture.flipY = false;
const state = reactive({ isMouseDown: false, isReady: false })

var tl = gsap.timeline({ paused: true });

const uniforms = reactive({
  iResolution: { value: new THREE.Vector3() },
  iTime: { value: 0.0 },
  iMouse: { value: { x: window.innerWidth / 2, y: window.innerHeight / 2 } },
  iChannel0: { value: texture },
  iTravel: { value: 1.0 }
});
const gui = new dat.GUI();
gui.add(uniforms.iTravel, 'value', -5.0, 5.0);
var vFOV = THREE.MathUtils.degToRad(camera.fov); // convert vertical fov to radians
var hh = 2 * Math.tan(vFOV / 2) * camera.position.z; // visible height
var ww = hh * camera.aspect;           // visible width
const geometry = new THREE.PlaneGeometry(ww, hh);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vShader,
  fragmentShader: sunsetCloudsShader,
});
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);
// const light = new THREE.PointLight( 0xff0000, 1, 100 );
// light.position.set( 50, 50, -5 );
// scene.add( light );
// const cubegeometry = new THREE.BoxGeometry( 1, 1, 1 );
// const cubematerial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( cubegeometry, cubematerial );
// cube.position.z = -5;
// scene.add( cube );
onWindowResize();

window.addEventListener('resize', onWindowResize, false);

if ('ontouchstart' in window) {
  document.addEventListener('touchmove', move);
}
else {
  document.addEventListener('mousemove', move);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  const canvas = renderer.domElement;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = clock.getElapsedTime();
  // controls.update();

}

function move(evt) {
  uniforms.iMouse.value.x = evt.touches ? evt.touches[0].clientX : evt.clientX;
  uniforms.iMouse.value.y = (evt.touches ? evt.touches[0].clientY : evt.clientY);

}

function mDown(evt) {
  if ('ontouchstart' in window) {
    document.removeEventListener('touchmove', move);
  }
  else {
    document.removeEventListener('mousemove', move);
  }
  tl.restart();
  state.isMouseDown = true;
}

function mUp(evt) {
  if ('ontouchstart' in window) {
    document.addEventListener('touchmove', move);
  }
  else {
    document.addEventListener('mousemove', move);
  }
  tl.reverse();
  state.isMouseDown = false;
}



function onWindowResize(event) {
  const aspectRatio = window.innerWidth / window.innerHeight;
  let width, height;
  if (aspectRatio >= 1) {
    width = 1;
    height = (window.innerHeight / window.innerWidth) * width;
  } else {
    width = aspectRatio;
    height = 1;
  }
  camera.left = -width;
  camera.right = width;
  camera.top = height;
  camera.bottom = -height;
  camera.updateProjectionMatrix();
  if (uniforms.iResolution !== undefined) {
    uniforms.iResolution.value.x = window.innerWidth;
    uniforms.iResolution.value.y = window.innerHeight;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);

}

window.scene = this;


onMounted(() => {
  animate();
  loadCharacter();
  tl.to(uniforms.iMouse.value, { y: -1000, duration: 3 });
  tl.to('#banner-img', { yPercent: -200, duration: 2.5 }, '<');
  tl.set(uniforms.iTravel, { value: -1 })
  tl.to(uniforms.iMouse.value, {
    y: 0, duration: 2, onComplete: function () {
      document.removeEventListener('mousedown', mDown);
      document.removeEventListener('mouseup', mUp);
      document.removeEventListener('touchstart', mDown);
      document.removeEventListener('touchend', mUp);
      gsap.to('.Progress', { opacity: 0, duration: 0.5 })
      if ('ontouchstart' in window) {
        document.addEventListener('touchmove', move);
      }
      else {
        document.addEventListener('mousemove', move);
      }
      addCharacter();
    }
  });

})

const Bind = () =>{
  if ('ontouchstart' in window) {
  document.addEventListener('touchstart', mDown);
  document.addEventListener('touchend', mUp);
}
else {
  document.addEventListener('mousedown', mDown);
  document.addEventListener('mouseup', mUp);
}
}

const loadCharacter = () => {
  const loader = new GLTFLoader();

  // Load a glTF resource
  loader.load(
    // resource URL
    GLTFModel,
    // called when the resource is loaded
    function (gltf) {

      CharacterModel = gltf.scene;
      Bind();
      state.isReady = true;
    },
    // called while loading is progressing
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

      console.log('An error happened', error);

    }
  );
}
const addCharacter = () => {
  CharacterModel.position.z = -5;

  scene.add(CharacterModel);
  console.log(scene);
}
</script>

<template>
  <div class="flex h-screen w-screen absolute top-0 left-0 flex-col items-center justify-between py-20">
    <img id="banner-img" src="@/assets/K-top-face.png" class="h-80" />
    <div :class="{ active: state.isMouseDown, hidden: !state.isReady }"
      class="content-wrapper flex w-52 flex-col items-center text-sm text-white/50">
      <p class="content-title font-bold">CLICK &amp; HOLD</p>
      <p class="content-text text-center">to enter into the world of Kuverr</p>
    </div>
  </div>
  <div class="Progress">
    <div class="Progress_labels">
      <p :class="{ active: state.isMouseDown }" class="Progress_label">Keep holding</p>
    </div>
    <div :class="{ active: state.isMouseDown }" class="Progress_bar Progress_bar--left"></div>
    <div :class="{ active: state.isMouseDown }" class="Progress_bar Progress_bar--right"></div>
  </div>
  <div class="text-white/30 absolute w-fit h-fit top-0 right-0 hidden">
    <p>iMouseX: {{ uniforms.iMouse.value.x }}</p>
    <p>iMouseY: {{ uniforms.iMouse.value.y }}</p>
    <p>iMouseXSin: {{ (uniforms.iMouse.value.x / uniforms.iResolution.value.x).toFixed(2) }}</p>
    <p>iMouseYSin: {{ (uniforms.iMouse.value.y / uniforms.iResolution.value.y).toFixed(2) }}</p>
  </div>
</template>

<style>
.content-wrapper {
  transition: 300ms all ease-in-out;
  overflow: hidden;
}

.content-wrapper.active {
  opacity: 0;
}

.Progress {
  outline: none;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 200;
  user-select: none;
}

.Progress_labels {
  user-select: none;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
  position: absolute;
  bottom: 50px;
  left: 50%;
  padding: 1px 0;
  text-align: center;
  transform: translate(-50%);
  overflow: hidden;
}

.Progress_label {
  user-select: none;
  text-align: center;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
  -webkit-font-smoothing: antialiased;
  font-size: 16px;
  font-family: Platform-Medium, Helvetica, Arial, sans-serif;
  color: #eff7ff;
  letter-spacing: 7px;
  text-transform: uppercase;
  transform: translateY(110%);
  transition: 0.5s;
}

.Progress_label.active {
  transform: translateY(0%);
}

.Progress_bar.Progress_bar--left {
  user-select: none;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
  position: absolute;
  bottom: 0;
  width: 50%;
  height: 3px;
  background: #eff7ff;
  transform: scaleX(0);
  left: 0;
  transform-origin: 100% 100%;
}

.Progress_bar.Progress_bar--right {
  user-select: none;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
  position: absolute;
  bottom: 0;
  width: 50%;
  height: 3px;
  background: #eff7ff;
  transform: scaleX(0);
  right: 0;
  transform-origin: 0 100%;
}

.Progress_bar:not(.active) {
  transition: 0.3s ease-in-out;
}

.Progress_bar.active {
  transition: 5s ease-in-out;
  transform: scaleX(1);
}
</style>