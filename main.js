import * as THREE from 'three';

			import Stats from 'three/addons/libs/stats.module.js';

			import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
			import { Water } from 'three/addons/objects/Water.js';
			import { Sky } from 'three/addons/objects/Sky.js';
			import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

			let container, stats, timer;
			let camera, scene, renderer;
			let controls, water, sun, sky, mesh, bloomPass;

			init();

			function init() {

				container = document.getElementById( 'threejs-bg' );

				//

				renderer = new THREE.WebGLRenderer( { outputBufferType: THREE.HalfFloatType } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.setAnimationLoop( animate );
				renderer.toneMapping = THREE.ACESFilmicToneMapping;
				renderer.toneMappingExposure = 0.05;
				container.appendChild( renderer.domElement );

				bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
				bloomPass.threshold = 0;
				bloomPass.strength = 0.075;
				bloomPass.radius = 0.5;
				renderer.setEffects( [ bloomPass ] );

				//

				scene = new THREE.Scene();

				camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
				camera.position.set( 30, 30, 100 );
				camera.lookAt( 0, 10, 0 );

				timer = new THREE.Timer();

				//

				sun = new THREE.Vector3();

				// Water

				const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

				water = new Water(
					waterGeometry,
					{
						textureWidth: 512,
						textureHeight: 512,
						waterNormals: new THREE.TextureLoader().load( 'public/textures/waternormals.jpg', function ( texture ) {

							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						} ),
						sunDirection: new THREE.Vector3(),
						sunColor: 0xc080ff,
						waterColor: 0x001e0f,
						distortionScale: 6,
						fog: scene.fog !== undefined
						
					}
				);


				water.rotation.x = - Math.PI / 2;

				scene.add( water );

				// Skybox

				sky = new Sky();
				sky.scale.setScalar( 10000 );
				scene.add( sky );

				const skyUniforms = sky.material.uniforms;

				skyUniforms[ 'turbidity' ].value = 10;
				skyUniforms[ 'rayleigh' ].value = 1;
				skyUniforms[ 'mieCoefficient' ].value = 0.005;
				skyUniforms[ 'mieDirectionalG' ].value = 0.8;
				skyUniforms[ 'cloudCoverage' ].value = 0.26;
				skyUniforms[ 'cloudDensity' ].value = 0.6;
				skyUniforms[ 'cloudElevation' ].value = 0.5;

				const parameters = {
					elevation: 22.5,
					azimuth: 180,
					exposure: 0.03
				};

				const pmremGenerator = new THREE.PMREMGenerator( renderer );
				const sceneEnv = new THREE.Scene();

				let renderTarget;

				function updateSun() {


					const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
					const theta = THREE.MathUtils.degToRad( parameters.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
					water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

					if ( renderTarget !== undefined ) renderTarget.dispose();

					sceneEnv.add( sky );
					renderTarget = pmremGenerator.fromScene( sceneEnv );
					scene.add( sky );

					scene.environment = renderTarget.texture;

				}

				updateSun();

				//

				const geometry = new THREE.BoxGeometry( 30, 30, 30 );
				const material = new THREE.MeshStandardMaterial( { roughness: 0 } );

				mesh = new THREE.Mesh( geometry, material );
				scene.add( mesh );

				//

				// OrbitControls which are useless with the negative z-index, but I will leave them here for future use
				// controls = new OrbitControls( camera, renderer.domElement );
				// controls.maxPolarAngle = Math.PI * 0.495;
				// controls.target.set( 0, 10, 0 );
				// controls.minDistance = 40.0;
				// controls.maxDistance = 200.0;
				// controls.update();

				//

				stats = new Stats();
				container.appendChild( stats.dom );

				window.addEventListener( 'resize', onWindowResize );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {

				timer.update();
				render();
				stats.update();

			}

			function render() {

				//console.log(camera.rotation.x, camera.rotation.y, camera.rotation.z);
				// -0.1973955598498809 0.286103493730573 0.056383426681258585


				const time = performance.now() * 0.001;

				mesh.position.y = Math.sin( time ) * 20 + 5;
				mesh.rotation.x = time * 0.5;
				mesh.rotation.z = time * 0.51;

				const delta = timer.getDelta();

				water.material.uniforms[ 'time' ].value += delta;
				sky.material.uniforms[ 'time' ].value = time;

				renderer.render( scene, camera );

			}