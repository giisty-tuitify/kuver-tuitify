<script setup>
import * as THREE from 'three'
import vShader from './vShader.vert';
import fShaderSplash from './fShader.frag';

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,10);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);
const clock = new THREE.Clock();
const uniforms = {
  iResolution: {value: new THREE.Vector3()},
  iTime: {value: 0.0},
  iMouse: {value: {x:0.0, y:0.0}},

}

const geometry = new THREE.PlaneGeometry(2,2);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vShader,
  fragmentShader: fShaderSplash,
});
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);
camera.position.z = 1;

onWindowResize();


if('ontouchstart' in window){
  document.addEventListener('touchmove', move);
}
else{
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', move);
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene,camera);
  const canvas = renderer.domElement;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = clock.getElapsedTime();
}

function move(evt) {
  uniforms.iMouse.value.x = evt.touches ? evt.touches[0].clientX : evt.clientX;
  uniforms.iMouse.value.y = evt.touches ? evt.touches[0].clientY : evt.clientY;
  
}


function onWindowResize( event ) {
  const aspectRatio = window.innerWidth/window.innerHeight;
  let width, height;
  if (aspectRatio>=1){
    width = 1;
    height = (window.innerHeight/window.innerWidth) * width;
  }else{
    width = aspectRatio;
    height = 1;
  }
  camera.left = -width;
  camera.right = width;
  camera.top = height;
  camera.bottom = -height;
  camera.updateProjectionMatrix();
  if(uniforms.iResolution !== undefined){
    uniforms.iResolution.value.x = window.innerWidth;
    uniforms.iResolution.value.y = window.innerHeight;
  }
  renderer.setSize( window.innerWidth, window.innerHeight );
}


animate();
</script>

<template>
    
</template>