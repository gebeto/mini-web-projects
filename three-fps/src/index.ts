import * as THREE from 'three/build/three.module';
import * as CANNON from 'cannon';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
// import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Projector } from 'three/examples/jsm/renderers/Projector';

import { PointerLockControls } from './PointerLockControls';



let sphereShape: any;
let sphereBody: any;
let world: any;
let light: any;
let physicsMaterial: any;
let walls: any = [];
let balls: any = [];
let ballMeshes: any = [];
let boxes: any = [];
let boxMeshes: any = [];


let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer;
let geometry: THREE.Geometry;
let material: THREE.Material;
let mesh: THREE.Mesh;
let controls: any;
let time = Date.now();

var blocker = <HTMLElement>document.getElementById("blocker");
var instructions = <HTMLElement>document.getElementById("instructions");

var havePointerLock =
	"pointerLockElement" in document ||
	"mozPointerLockElement" in document ||
	"webkitPointerLockElement" in document;

if (havePointerLock) {
	var element = document.body;

	var pointerlockchange = function(event: any) {
		if ((document as any).pointerLockElement === element || (document as any).mozPointerLockElement === element || (document as any).webkitPointerLockElement === element) {
			controls.isLocked = true;
			blocker.style.display = "none";
		} else {
			controls.isLocked = false;

			blocker.style.display = "-webkit-box";
			blocker.style.display = "-moz-box";
			blocker.style.display = "box";

			instructions.style.display = "";
		}
	};

	var pointerlockerror = function(event: any) {
		instructions.style.display = "";
	};

	// Hook pointer lock state change events
	document.addEventListener("pointerlockchange", pointerlockchange, false);
	document.addEventListener("mozpointerlockchange", pointerlockchange, false);
	document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

	document.addEventListener("pointerlockerror", pointerlockerror, false);
	document.addEventListener("mozpointerlockerror", pointerlockerror, false);
	document.addEventListener("webkitpointerlockerror", pointerlockerror, false);

	instructions.addEventListener(
		"click",
		function(event) {
			instructions.style.display = "none";

			// Ask the browser to lock the pointer
			(element as any).requestPointerLock =
				(element as any).requestPointerLock ||
				(element as any).mozRequestPointerLock ||
				(element as any).webkitRequestPointerLock;

			if (/Firefox/i.test(navigator.userAgent)) {
				var fullscreenchange = function(event) {
					if (
						(document as any).fullscreenElement === element ||
						(document as any).mozFullscreenElement === element ||
						(document as any).mozFullScreenElement === element
					) {
						document.removeEventListener("fullscreenchange", fullscreenchange);
						document.removeEventListener(
							"mozfullscreenchange",
							fullscreenchange
						);

						(element as any).requestPointerLock();
					}
				};

				document.addEventListener("fullscreenchange", fullscreenchange, false);
				document.addEventListener(
					"mozfullscreenchange",
					fullscreenchange,
					false
				);

				element.requestFullscreen =
					element.requestFullscreen ||
					(element as any).mozRequestFullscreen ||
					(element as any).mozRequestFullScreen ||
					(element as any).webkitRequestFullscreen;

				element.requestFullscreen();
			} else {
				(element as any).requestPointerLock();
			}
		},
		false
	);
} else {
	instructions.innerHTML = "Your browser doesn't seem to support Pointer Lock API";
}

initCannon();
init();
animate();

function initCannon() {
	// Setup our world
	world = new CANNON.World();
	world.quatNormalizeSkip = 0;
	world.quatNormalizeFast = false;

	var solver = new CANNON.GSSolver();

	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;

	solver.iterations = 7;
	solver.tolerance = 0.1;
	var split = true;
	if (split) world.solver = new CANNON.SplitSolver(solver);
	else world.solver = solver;

	world.gravity.set(0, -20, 0);
	world.broadphase = new CANNON.NaiveBroadphase();

	// Create a slippery material (friction coefficient = 0.0)
	physicsMaterial = new CANNON.Material("slipperyMaterial");
	var physicsContactMaterial = new (CANNON.ContactMaterial as any)(
		physicsMaterial,
		physicsMaterial,
		0.0, // friction coefficient
		0.3 // restitution
	);
	// We must add the contact materials to the world
	world.addContactMaterial(physicsContactMaterial);

	// Create a sphere
	var mass = 5,
		radius = 1.3;
	sphereShape = new CANNON.Sphere(radius);
	sphereBody = new CANNON.Body({ mass: mass });
	sphereBody.addShape(sphereShape);
	sphereBody.position.set(0, 5, 0);
	sphereBody.linearDamping = 0.9;
	world.add(sphereBody);

	// Create a plane
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.Body({ mass: 0 });
	groundBody.addShape(groundShape);
	groundBody.quaternion.setFromAxisAngle(
		new CANNON.Vec3(1, 0, 0),
		-Math.PI / 2
	);
	world.add(groundBody);
}

function init() {
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 0, 500);

	var ambient = new THREE.AmbientLight(0x111111);
	scene.add(ambient);

	light = new THREE.SpotLight(0xffffff);
	light.position.set(10, 30, 20);
	light.target.position.set(0, 0, 0);
	if (true) {
		light.castShadow = true;

		light.shadowCameraNear = 20;
		light.shadowCameraFar = 50; //camera.far;
		light.shadowCameraFov = 40;

		light.shadowMapBias = 0.1;
		light.shadowMapDarkness = 0.7;
		light.shadowMapWidth = 2 * 512;
		light.shadowMapHeight = 2 * 512;

		light.shadowCameraVisible = true;
	}
	scene.add(light);

	controls = new PointerLockControls(camera, sphereBody);
	console.log('controls', controls);
	scene.add(controls.getObject());

	// floor
	geometry = new THREE.PlaneGeometry(300, 300, 50, 50);
	geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

	material = new THREE.MeshLambertMaterial({ color: 0xdddddd });

	mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	scene.add(mesh);

	renderer = new THREE.WebGLRenderer();
	console.log(renderer);
	(window as any).renderer = renderer;
	// renderer.shadowMapEnabled = true;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.renderReverseSided = true;

	(renderer as any).shadowMapSoft = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(scene.fog.color, 1);

	document.body.appendChild(renderer.domElement);

	window.addEventListener("resize", onWindowResize, false);

	// Add boxes
	var halfExtents = new CANNON.Vec3(1, 1, 1);
	var boxShape = new CANNON.Box(halfExtents);
	var boxGeometry = new THREE.BoxGeometry(
		halfExtents.x * 2,
		halfExtents.y * 2,
		halfExtents.z * 2
	);
	for (var i = 0; i < 7; i++) {
		var x = (Math.random() - 0.5) * 20;
		var y = 1 + (Math.random() - 0.5) * 1;
		var z = (Math.random() - 0.5) * 20;
		var boxBody = new CANNON.Body({ mass: 5 });
		boxBody.addShape(boxShape);
		var boxMesh = new THREE.Mesh(boxGeometry, material);
		world.add(boxBody);
		scene.add(boxMesh);
		boxBody.position.set(x, y, z);
		boxMesh.position.set(x, y, z);
		boxMesh.castShadow = true;
		boxMesh.receiveShadow = true;
		boxes.push(boxBody);
		boxMeshes.push(boxMesh);
	}

	// Add linked boxes
	var size = 0.5;
	var he = new CANNON.Vec3(size, size, size * 0.1);
	var boxShape = new CANNON.Box(he);
	var mass = 0;
	var space = 0.1 * size;
	var N = 5,
		last;
	var boxGeometry = new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2);
	for (var i = 0; i < N; i++) {
		var boxbody = new CANNON.Body({ mass: mass });
		boxbody.addShape(boxShape);
		var boxMesh = new THREE.Mesh(boxGeometry, material);
		boxbody.position.set(
			5,
			(N - i) * (size * 2 + 2 * space) + size * 2 + space,
			0
		);
		boxbody.linearDamping = 0.01;
		boxbody.angularDamping = 0.01;
		// boxMesh.castShadow = true;
		boxMesh.receiveShadow = true;
		world.add(boxbody);
		scene.add(boxMesh);
		boxes.push(boxbody);
		boxMeshes.push(boxMesh);

		if (i != 0) {
			// Connect this body to the last one
			var c1 = new (CANNON.PointToPointConstraint as any)(
				boxbody,
				new CANNON.Vec3(-size, size + space, 0),
				last,
				new CANNON.Vec3(-size, -size - space, 0)
			);
			var c2 = new (CANNON.PointToPointConstraint as any)(
				boxbody,
				new CANNON.Vec3(size, size + space, 0),
				last,
				new CANNON.Vec3(size, -size - space, 0)
			);
			world.addConstraint(c1);
			world.addConstraint(c2);
		} else {
			mass = 0.3;
		}
		last = boxbody;
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

var dt = 1 / 60;
function animate() {
	requestAnimationFrame(animate);
	if (controls.isLocked) {
		world.step(dt);

		// Update ball positions
		for (var i = 0; i < balls.length; i++) {
			ballMeshes[i].position.copy(balls[i].position);
			ballMeshes[i].quaternion.copy(balls[i].quaternion);
		}

		// Update box positions
		for (var i = 0; i < boxes.length; i++) {
			boxMeshes[i].position.copy(boxes[i].position);
			boxMeshes[i].quaternion.copy(boxes[i].quaternion);
		}
	}

	controls.update(Date.now() - time);
	renderer.render(scene, camera);
	time = Date.now();
}

var ballShape = new CANNON.Sphere(0.2);
var ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
var shootDirection = new THREE.Vector3();
var shootVelo = 15;
var projector = new Projector();
function getShootDir(targetVec: any) {
	var vector = targetVec;
	targetVec.set(0, 0, 1);
	(projector as any).unprojectVector(vector, camera);
	var ray = new THREE.Ray(
		sphereBody.position,
		vector.sub(sphereBody.position).normalize()
	);
	targetVec.copy(ray.direction);
}

var stretchingTime = 0;
window.addEventListener("mousedown", function(e) {
	stretchingTime = Date.now();
});

window.addEventListener("mouseup", function(e) {
	shootVelo = 10 + Math.floor((Date.now() - stretchingTime) / 50);
	console.log(shootVelo);
});

window.addEventListener("click", function(e) {
	console.log("click 123");
	if (controls.isLocked == true) {
		var x = sphereBody.position.x;
		var y = sphereBody.position.y;
		var z = sphereBody.position.z;
		var ballBody = new CANNON.Body({ mass: 1 });
		ballBody.addShape(ballShape);
		var ballMesh = new THREE.Mesh(ballGeometry, material);
		world.add(ballBody);
		scene.add(ballMesh);
		ballMesh.castShadow = true;
		ballMesh.receiveShadow = true;
		balls.push(ballBody);
		ballMeshes.push(ballMesh);
		getShootDir(shootDirection);
		ballBody.velocity.set(
			shootDirection.x * shootVelo,
			shootDirection.y * shootVelo,
			shootDirection.z * shootVelo
		);

		// Move the ball outside the player sphere
		var ddd = 1.02;
		x += shootDirection.x * (sphereShape.radius * ddd + ballShape.radius);
		y += shootDirection.y * (sphereShape.radius * ddd + ballShape.radius);
		z += shootDirection.z * (sphereShape.radius * ddd + ballShape.radius);
		ballBody.position.set(x, y, z);
		ballMesh.position.set(x, y, z);
	}
});
