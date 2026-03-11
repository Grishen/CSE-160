class World {
    constructor() {
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    update() {
        for (let entity of this.entities) {
            entity.update();
        }
    }

    draw() {
        for (let entity of this.entities) {
            entity.draw();
        }
    }
}