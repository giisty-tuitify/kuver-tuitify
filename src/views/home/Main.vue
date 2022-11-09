<script setup>
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import vShader from './vShader.vert';
import sunsetCloudsShader from './sunsetClouds.frag';

import noiseTex from './noise-2.png'
import { reactive } from '@vue/reactivity';


const scene = new THREE.Scene();
// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
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


const uniforms = reactive({
  iResolution: { value: new THREE.Vector3() },
  iTime: { value: 0.0 },
  iMouse: { value: { x: window.innerWidth/2, y: window.innerHeight/2 } },
  iChannel0: { value: texture }
});
var vFOV = THREE.MathUtils.degToRad( camera.fov ); // convert vertical fov to radians
  var hh = 2 * Math.tan( vFOV / 2 ) * camera.position.z; // visible height
  var ww = hh * camera.aspect;           // visible width
const geometry = new THREE.PlaneGeometry(ww,hh);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vShader,
  fragmentShader: sunsetCloudsShader,
});
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);



onWindowResize();


if ('ontouchstart' in window) {
  document.addEventListener('touchmove', move);
}
else {
  window.addEventListener('resize', onWindowResize, false);
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
animate();
</script>

<template>
  <div class="flex h-screen w-screen absolute top-0 left-0 flex items-center justify-center -translate-y-40">
    <img src="@/assets/k-top-face.png" class="h-80"/>
  </div>
  <div class="text-white/30 absolute w-fit h-fit top-0 right-0">
    <p>iMouseX: {{ uniforms.iMouse.value.x }}</p>
    <p>iMouseY: {{ uniforms.iMouse.value.y}}</p>
    <p>iMouseXSin: {{ (uniforms.iMouse.value.x / uniforms.iResolution.value.x).toFixed(2) }}</p>
    <p>iMouseYSin: {{ (uniforms.iMouse.value.y / uniforms.iResolution.value.y).toFixed(2)}}</p>
  </div>
</template>