class Camera{
   constructor(){
      this.fov = 60;
      this.eye = new Vector3([0,.5,3]);
      this.at  = new Vector3([0,0,-100]);
      this.up  = new Vector3([0,1,0]);
      this.viewMat = new Matrix4();
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
      this.projMat = new Matrix4();
      this.projMat.setPerspective(50, canvas.width/canvas.height, 0.1, 1000);
   }

   forward(){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      f = f.normalize();
      this.at = this.at.add(f.mul(0.5));
      this.eye = this.eye.add(f.mul(0.5));
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   back(){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      f = f.normalize();
      this.at = this.at.sub(f.mul(0.5));
      this.eye = this.eye.sub(f.mul(0.5));
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   left(){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      f = f.normalize();
      var s = new Vector3([0,0,0]);
      s.set(Vector3.cross(f, this.up));
      s = s.normalize();
      this.at = this.at.sub(s.mul(0.25));
      this.eye = this.eye.sub(s.mul(0.25));
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   right(){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      f = f.normalize();
      var s = new Vector3([0,0,0]);
      s.set(Vector3.cross(f, this.up));
      s = s.normalize();
      this.at = this.at.add(s.mul(0.25));
      this.eye = this.eye.add(s.mul(0.25));
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   moveUp(){
      var d = 0.25;
      this.eye.elements[1] += d;
      this.at.elements[1] += d;
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]);
   }

   moveDown(){
      var d = 0.25;
      this.eye.elements[1] -= d;
      this.at.elements[1] -= d;
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]);
   }

   // Pitch: positive = look up, negative = look down (rotate view around right axis)
   pitch(deg){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      var dist = Math.sqrt(f.elements[0]*f.elements[0] + f.elements[1]*f.elements[1] + f.elements[2]*f.elements[2]);
      f = f.normalize();
      var right = new Vector3([0,0,0]);
      right.set(Vector3.cross(f, this.up));
      right = right.normalize();
      var rot = new Matrix4();
      rot.setRotate(-deg, right.elements[0], right.elements[1], right.elements[2]);
      var fNew = rot.multiplyVector3(f);
      fNew = fNew.normalize();
      this.at.set(this.eye);
      this.at = this.at.add(fNew.mul(dist));
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]);
   }

   panLeft(){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(10, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = new Vector3([0,0,0]);
      f_prime = rotationMatrix.multiplyVector3(f);
      var tempEye = new Vector3([0,0,0]);
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      // console.log(this.at.elements[1]);
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   panRight(){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(-10, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = new Vector3([0,0,0]);
      f_prime = rotationMatrix.multiplyVector3(f);
      var tempEye = new Vector3([0,0,0]);
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      // console.log(this.at.elements[1]);
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   panMLeft(deg){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = new Vector3([0,0,0]);
      f_prime = rotationMatrix.multiplyVector3(f);
      var tempEye = new Vector3([0,0,0]);
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      // console.log(this.at.elements[1]);
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }

   panMRight(deg){
      var f = new Vector3([0,0,0]);
      f.set(this.at);
      f.sub(this.eye);
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = new Vector3([0,0,0]);
      f_prime = rotationMatrix.multiplyVector3(f);
      var tempEye = new Vector3([0,0,0]);
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      // console.log(this.at.elements[1]);
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
   }
}
