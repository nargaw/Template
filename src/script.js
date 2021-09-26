import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as CANNON from 'cannon-es'
import cannonDebugger from 'cannon-es-debugger'
import { Vector3 } from 'three'
const canvas = document.querySelector('.webgl')
class NewScene{
    constructor(){
        this._Init()
    }
    
    _Init(){
        this.scene = new THREE.Scene()
        this.clock = new THREE.Clock()
        this.oldElapsedTime = 0
        this.updateWord = []
        this.InitPhysics()
        //this.InitPhysicsDebugger()
        this.InitEnv()
        this.InitFont()
        this.InitCamera()
        this.InitLights()
        this.InitRenderer()
        this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
    }

    InitPhysics(){
        this.world = new CANNON.World()
        this.world.gravity.set(0, (-9.82/4), 0)
        this.world.defaultContactMaterial = this.defaultContactMaterial

        this.defaultMaterial = new CANNON.Material('default')
        this.defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial, 
            this.defaultMaterial,
            {
                friction: 0.1,
                restitution: 0.9
            }
        )
        this.world.addContactMaterial(this.defaultContactMaterial)
    }

    InitPhysicsDebugger(){
        cannonDebugger(
            this.scene, 
            this.world.bodies,
            {
                color: 0xff0000,
                autoUpdate: true
            }
        )
    }

    InitEnv(){
        this.planeGeometry = new THREE.PlaneBufferGeometry(25, 25)
        this.planeMaterial = new THREE.MeshStandardMaterial({color: 0x023047, side: THREE.DoubleSide})
        this.planeFloor = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
        this.planeRoof = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
        this.planeRightWall = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
        this.planeLeftWall = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
        this.planeBackWall = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
        this.planeFrontWall = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
        this.scene.add(this.planeFloor, this.planeRoof, this.planeRightWall, this.planeLeftWall, this.planeBackWall, this.planeFrontWall)

        this.planeFloor.rotation.x = -Math.PI * 0.5
        this.planeFloor.position.set(0, -12.5, 0)
        this.planeFloor.receiveShadow = true

        this.planeRoof.rotation.x = Math.PI * 0.5
        this.planeRoof.position.set(0, 12.5, 0)

        this.planeRightWall.rotation.y = -Math.PI * 0.5
        this.planeRightWall.position.set(12.5, 0, 0)
        this.planeRightWall.receiveShadow = true

        this.planeLeftWall.rotation.y = Math.PI * 0.5
        this.planeLeftWall.position.set(-12.5, 0, 0)
        this.planeLeftWall.receiveShadow = true

        this.planeBackWall.rotation.z = -Math.PI * 0.5
        this.planeBackWall.position.set(0, 0, -12.5)
        this.planeBackWall.receiveShadow = true

        this.planeFrontWall.position.set(0, 0, 12.5)
        this.planeFrontWall.receiveShadow = true

        //cannon
        this.floorBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.floorBody)
        this.floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
        this.floorBody.addShape(new CANNON.Box(new CANNON.Vec3(12.5, 12.5, 0.1)), new CANNON.Vec3(0, 0, -12.5))

        //cannon backwall
        this.backwallBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.backwallBody)
        this.backwallBody.addShape(new CANNON.Box(new CANNON.Vec3(12.5, 12.5, 0.1)), new CANNON.Vec3(0, 0, -12.5))

        //cannon frontwall
        this.frontwallBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.frontwallBody)
        this.frontwallBody.addShape(new CANNON.Box(new CANNON.Vec3(12.5, 12.5, 0.1)), new CANNON.Vec3(0, 0, 12.5))

        //cannon leftwall
        this.leftwallBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.leftwallBody)
        this.leftwallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, -1, 0), Math.PI * 0.5)
        this.leftwallBody.addShape(new CANNON.Box(new CANNON.Vec3(12.5, 12.5, 0.1)), new CANNON.Vec3(0, 0, 12.5))

        //cannon rightwall
        this.rightwallBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.rightwallBody)
        this.rightwallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, -1, 0), Math.PI * 0.5)
        this.rightwallBody.addShape(new CANNON.Box(new CANNON.Vec3(12.5, 12.5, 0.1)), new CANNON.Vec3(0, 0, -12.5))
    }

    InitFont(){
        let input = ''
        this.word = []
        const formElem = document.querySelector('form')
        formElem.addEventListener('submit', (e) => {
            e.preventDefault()
            input = document.getElementById('text').value
            document.getElementById('text').value = ''
            this.word = input
            console.log(this.word)
        
            this.fontLoader = new THREE.FontLoader()
            this.objectsToUpdate = []
            this.createText = () => {
                this.fontLoader.load(
                'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/droid/droid_serif_bold.typeface.json',
                (font) => {
                    this.textParameters = {
                        font: font,
                        size: 0.5,
                        height: 0.1,
                        curveSegments: 12,
                        bevelEnabled: true,
                        bevelThickness: 0.03,
                        bevelSize: 0.02,
                        bevelOffset: 0,
                        bevelSegments: 5
                    }
                    
                    
                    for (let i = 0; i <= this.word.length-1 ; i++){
                        this.textGeometry = new THREE.TextGeometry(
                        this.word[i],
                        this.textParameters
                        )
                        this.textMaterial = new THREE.MeshStandardMaterial({color: 0xffb703})
                        this.text = new THREE.Mesh(this.textGeometry, this.textMaterial)
                        this.scene.add(this.text)
                        this.text.castShadow = true
                        this.textGeometry.computeBoundingBox()
                        this.textGeometry.center()
                        this.text.position.set(0, 0, 0)

                        this.boxShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.4, 0.2))
                        this.boxBody = new CANNON.Body({
                            mass: 1,
                            position: new CANNON.Vec3((i * 0.4) - 2, 3, 0),
                            shape: this.boxShape,
                            material: this.defaultMaterial
                        })
                        this.world.addBody(this.boxBody)
                        this.updateWord.push({
                            mesh: this.text,
                            body: this.boxBody
                        })
                    }
                    
                })  
            }
        this.createText()
        })
        
    }

    
    
    InitRenderer(){
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.render(this.scene, this.camera)
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100)
        this.camera.position.set(-5, 5, 10)
        this.scene.add(this.camera)
        this.camera.lookAt(new THREE.Vector3(0, -12, 0))
    }

    InitLights(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.scene.add(this.ambientLight)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
        this.scene.add(this.directionalLight)
        this.directionalLight.position.set(0, 12.5, -5)
        this.pointLight = new THREE.PointLight(0xffffff, 0.5)
        this.scene.add(this.pointLight)
        this.pointLight.position.set(0, 12.5, 5)
        this.directionalLight.castShadow = true
        this.pointLight.castShadow = true
    }

    InitControls(){
        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.enableDamping = true
        this.controls.update()
        this.controls.enablePan = false
        this.controls.enableZoom = false
    }

    Resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    Update(){
        requestAnimationFrame(() => {
               
            this.elapsedTime = this.clock.getElapsedTime()
            this.delatTime = this.elapsedTime - this.oldElapsedTime
            this.oldElapsedTime = this.elapsedTime
            
            this.world.step(1/60, this.delatTime, 3)

            if (this.text !== undefined){
                for(this.object of this.updateWord){
                    this.object.mesh.position.copy(this.object.body.position)
                    this.object.mesh.quaternion.copy(this.object.body.quaternion)
                }
            }
            
            this.renderer.render(this.scene, this.camera)
            this.controls.update()
            this.Update()
        })
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})