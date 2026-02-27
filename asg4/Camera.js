class Camera {
    constructor(position = [-1, 8, -1], target = [7, 0, 7]) {
        this.position = new Vector3(position);
        this.goalPosition = new Vector3(position);
        this.fov = 60
        this.target = new Vector3(target);
        this.goalTarget = new Vector3(target);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.up = new Vector3([0, 1, 0]);

        this.speed = 0.25;
        this.panSpeed = 15;

        this.nearClip = 0.01;
        this.farClip = 1000;

        this.aspect = window.innerWidth / window.innerHeight;

        window.addEventListener("resize", (e) => {
            this.aspect = window.innerWidth / window.innerHeight;

            this.calculateViewProjection();
        });

        // Controls
        this.canvas = gl.canvas;

        this.mouse = new Vector3(); // will use as a vector2
        this.lerpRotation = new Vector3();
        this.dragging = false;

        this.setHandlers();

        this.calculateViewProjection();
    }

    setHandlers() {
        this.canvas.onmousedown = (e) => {
            let x = (e.clientX / e.target.clientWidth) * 2.0 - 1.0;
            let y = (-e.clientY / e.target.clientHeight) * 2.0 + 1.0;

            this.mouse.elements.set([x, y, 0]);
            this.dragging = true;
        };

        this.canvas.onmouseup = () => {
            this.dragging = false;
        };

        // this.dragging = true;
        // this.mouse.elements.set([0, 0, 0]);

        this.canvas.onmousemove = (e) => {
            let x = (e.clientX / e.target.clientWidth) * 2.0 - 1.0;
            let y = (-e.clientY / e.target.clientHeight) * 2.0 + 1.0;

            if (this.dragging) {
                let dx = x - this.mouse.elements[0];
                let dy = y - this.mouse.elements[1];

                this.lerpRotation.elements[0] -= dy;
                this.lerpRotation.elements[1] += dx;

                this.mouse.elements.set([x, y, 0]);
            }
        };
    }

    update() {
        this.panHorizontal(-this.lerpRotation.elements[1]);
        this.lerpRotation.elements[1] *= 0.9;

        this.panVertical(this.lerpRotation.elements[0]);
        this.lerpRotation.elements[0] *= 0.9;

        let targetDiff = new Vector3();
        targetDiff.set(this.goalTarget);
        targetDiff.sub(this.target);
        if (targetDiff.magnitude() > 0.01) {
            this.target.add(targetDiff.mul(0.1));
        }

        let positionDiff = new Vector3();
        positionDiff.set(this.goalPosition);
        positionDiff.sub(this.position);
        if (positionDiff.magnitude() > 0.01) {
            this.position.add(positionDiff.mul(0.1));
        }
    }

    moveForward() {
        let f = new Vector3();
        f.set(this.goalTarget);
        f.sub(this.goalPosition);
        f.normalize();
        f.mul(this.speed);
        this.goalTarget.add(f);
        this.goalPosition.add(f);
        this.calculateViewProjection();
    }

    moveBackwards() {
        let f = new Vector3();
        f.set(this.goalPosition);
        f.sub(this.goalTarget);
        f.normalize();
        f.mul(this.speed);
        this.goalTarget.add(f);
        this.goalPosition.add(f);
        this.calculateViewProjection();
    }

    moveLeft() {
        let f = new Vector3();
        f.set(this.goalTarget);
        f.sub(this.goalPosition);
        let s = new Vector3();
        s.set(Vector3.cross(this.up, f));
        s.normalize();
        s.mul(this.speed);
        this.goalTarget.add(s);
        this.goalPosition.add(s);
        this.calculateViewProjection();
    }


    moveRight() {
        let f = new Vector3();
        f.set(this.goalPosition);
        f.sub(this.goalTarget);
        let s = new Vector3();
        s.set(Vector3.cross(this.up, f));
        s.normalize();
        s.mul(this.speed);
        this.goalTarget.add(s);
        this.goalPosition.add(s);
        this.calculateViewProjection();
    }

    panHorizontal(alpha) {
        let f = new Vector3();
        f.set(this.goalTarget);
        f.sub(this.goalPosition);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha * this.panSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = new Vector3();
        f_prime.set(rotationMatrix.multiplyVector3(f));
        f_prime.add(this.goalPosition)
        this.goalTarget.set(f_prime);
        this.calculateViewProjection();
    }

    panVertical(alpha) {
        let f = new Vector3();
        f.set(this.goalTarget);
        f.sub(this.goalPosition);
        let s = new Vector3();
        s.set(Vector3.cross(this.up, f));
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha * this.panSpeed, s.elements[0], s.elements[1], s.elements[2]);
        let f_prime = new Vector3();
        f_prime.set(rotationMatrix.multiplyVector3(f));
        f_prime.add(this.goalPosition)
        this.goalTarget.set(f_prime);
        this.calculateViewProjection();
    }



    calculateViewProjection() {
        this.viewMatrix.setLookAt(
            ...this.position.elements,
            ...this.target.elements,
            ...this.up.elements
        );

        this.projectionMatrix.setPerspective(this.fov, this.aspect, this.nearClip, this.farClip);
    }
}