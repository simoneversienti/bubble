function initializeBubbles(canvasElement, bubbleData) {
    var canvas = document.getElementById('renderCanvas');
    var engine = new BABYLON.Engine(canvasElement, true);
    var advancedTexture;
    var bubbleNames = [];
    var currentLevelData = bubbleData; // Memorizza i dati del livello corrente
    var parentLevels = []; // Stack per memorizzare i livelli genitore
    var bubbleParent = [];
    var createScene = function () {
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(1, 0.85, 0.90 ,1);
        var camera = new BABYLON.UniversalCamera("TouchCamera", new BABYLON.Vector3(0, 1, -5), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);
        camera.angularSensibilityX = 1000; // Valore più alto per ridurre la sensibilità sull'asse X
        camera.angularSensibilityY = 1000; // Valore più alto per ridurre la sensibilità sull'asse Y
        camera.speed = 1;
        // Keyframes per l'animazione
        startAnimation();
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
        function startAnimation() {
            var animation = new BABYLON.Animation("cameraAnimation", "position.z", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

            var keys = []; 
            keys.push({ frame: 0, value: -7 }); // Posizione iniziale della telecamera
            keys.push({ frame: 100, value: -9}); // Telecamera si allontana
            animation.setKeys(keys);

            // Applicazione dell'animazione alla telecamera
            camera.animations.push(animation);

            // Avvia l'animazione
            scene.beginAnimation(camera, 0, 100, false);
        }
        // Funzione per creare il testo sotto la bolla
        function createBubbleText(name, position, visible, image=false) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 1028, scene, true);
            dynamicTexture.hasAlpha = true; // Impostare la trasparenza della texture
            
            dynamicTexture.drawText(name, null, null, "bold 80px Arial", "black", "transparent", true);

            var plane = BABYLON.Mesh.CreatePlane("TextPlane", 2, scene);
            plane.position = new BABYLON.Vector3(position.x, position.y - 2.5, position.z); // Posizionare il piano del testo sotto la bolla
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.diffuseTexture = dynamicTexture;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            plane.material.backFaceCulling = false;

            if (!visible) {
                plane.visibility = 0; // Rendi il testo invisibile se non è nel livello corrente
            }
        }

        function createFirstText(name, image = false,link=false,description=false) {
            
            var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            
            var container = new BABYLON.GUI.StackPanel();
            container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            advancedTexture.addControl(container);
            var button1 = BABYLON.GUI.Button.CreateSimpleButton("but", "In " + name);
            button1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            button1.width ="128px";
            button1.height = "30px";
            button1.fontSize = 10;
            button1.color = "white";
            button1.background = "grey";
            button1.onPointerClickObservable.add(function(){
                if (parentLevels.length > 0) {
                    clearScene(advancedTexture); 
                    currentLevelData = parentLevels.pop(); // Torna al livello genitore
                    bubbleParent.pop();
                    parentBubble = bubbleParent.pop();
                    if (parentBubble) {
                        advancedTexture = createFirstText(parentBubble.name,parentBubble.image,parentBubble.link,parentBubble.description);
                    }
                    showBubbles(currentLevelData);
                    startAnimation();
                }
            });
            container.addControl(button1);
            if (image) {
                var base64ImageString = "data:image/png;base64," + image;
                var imageControl = new BABYLON.GUI.Image("image", base64ImageString);
                imageControl.width = "128px";
                imageControl.height = "128px";
                imageControl.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
                container.addControl(imageControl);
            }
            if (description) {
                var textBlock = new BABYLON.GUI.TextBlock();
                textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
                textBlock.text = description;
                textBlock.color = "black";
                textBlock.textWrapping = true; 
                textBlock.fontSize = 10;
                textBlock.width ="128px";
                textBlock.height ="128px";
                container.addControl(textBlock);
            }
            if (link) {
                var button2 = BABYLON.GUI.Button.CreateSimpleButton("but", "Link");
                button2.width = "128px";
                button2.fontSize = 10;
                button2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
                button2.height ="30px";
                button2.color = "white";
                button2.background = "grey";
                button2.onPointerClickObservable.add(function() {
                    location.href = link;
                });
                container.addControl(button2);
            }     
            return advancedTexture;
        }
        // Funzione per creare una bolla
        function createBubble(name, position, size, content,color,alpha=0, image=false) {
            bubbleNames.push(name);
            var bubble = BABYLON.MeshBuilder.CreateSphere(name, {diameter: size}, scene);
            bubble.position = position;
            bubble.material = new BABYLON.StandardMaterial(name + "Material", scene);
            bubble.material.diffuseColor = new BABYLON.Color3.FromHexString(color);
            if (alpha == 0) {
                bubble.material.alpha = 0.6; // Rendere la bolla trasparente
            }
            // Calcolare la posizione delle bolle contenute
            var innerBubbleSize = size / 3; // Ridurre la dimensione delle bolle interne
            content.forEach(function (innerBubble, index) {
                if (index<=4) {
                    var angle = Math.PI * 2 * index / content.length; // Angolo per distribuire le bolle internamente
                    var innerPosition = position.add(new BABYLON.Vector3(Math.cos(angle) * size / 4, Math.sin(angle) * size / 4, 0));
                    var image = innerBubble.image ? innerBubble.image : false;
                    createBubble(innerBubble.name, innerPosition, innerBubbleSize, innerBubble.content,innerBubble.color,0.8,image);
                }
            });
        }
        function clearScene(advancedTexture) {
            while (scene.meshes.length > 0) {
                scene.meshes[0].dispose();
            }
            if (advancedTexture) {
                advancedTexture.dispose();
            }
        }
        function showBubbles(bubblesData, parentPosition) {
            var startPosition = new BABYLON.Vector3(-2, 0, 0);
            bubblesData.forEach(function (bubbleData, index) {
                var image = bubbleData.image ? bubbleData.image : false;
                createBubble(bubbleData.name, startPosition.add(new BABYLON.Vector3(index * 3, 0, 0)), bubbleData.size, bubbleData.content,bubbleData.color,0,image);
                createBubbleText(bubbleData.name, startPosition.add(new BABYLON.Vector3(index * 3, 0, 0)), true,image);

            });
            
        }
        // Gestione clic su una bolla
        scene.onPointerDown = function (evt, pickResult) {
            if (pickResult.hit && bubbleNames.includes(pickResult.pickedMesh.name)) {
                var selectedBubbleData = currentLevelData.find(b => b.name === pickResult.pickedMesh.name);
                if (selectedBubbleData && selectedBubbleData.content.length > 0) {
                    // Memorizza il livello genitore
                    bubbleParent.push(selectedBubbleData);
                    parentLevels.push(currentLevelData);
                    currentLevelData = selectedBubbleData.content;
                    clearScene(advancedTexture);
                    showBubbles(currentLevelData);
                    advancedTexture = createFirstText(selectedBubbleData.name,selectedBubbleData.image,selectedBubbleData.link,selectedBubbleData.description);
                    startAnimation();
                }
            }
        };
        if (Array.isArray(currentLevelData) && currentLevelData.length > 0) {
            showBubbles(currentLevelData);
        }
        return scene;
    };

    var scene = createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener('resize', function () {
        engine.resize();
    });
}
window.initializeBubbles = initializeBubbles;