define(["./gameobject", "./../rendering/animation", "./../rendering/animationsheet"], function modulePowerUp(GameObject, Animation, AnimationSheet) {
    var Timer = Object.subclass("Timer", {
        initialize: function(time) {
            var that = this;

            this._time = time;
            this._tilTimeout = predicate(function() {
                return that._time > 0;
            }, {
                ctx: {
                    that: that
                }
            });
        },
        tilTimeout: function() {
            return this._tilTimeout;
        },
        update: function(dt) {
            this._time -= dt;
        },
        reset: function(additionalDuration) {
            this._time = Math.max(this._time, 0) + additionalDuration;
        }
    });

    var PowerUp = Object.subclass("PowerUp", {
        initialize: function(duration) {
            this.duration = duration;
        },
        activate: function(tank) {
            this.getTarget(tank).each(function(target) {
                this.setupTimer(target);
            }, this);

        },
        getTarget: function(tank) {
            return [tank];
        },
        setupTimer: function(tank) {
            if(tank.powerUps[this.key]) {
                tank.powerUps[this.key].reset(this.duration);
            } else {
                var timer = new Timer(this.duration);
                timer.tilTimeout().activate(this.effect(tank));
                tank.powerUps[this.key] = timer;
            }
        }
    });

    PowerUp.Spring = PowerUp.subclass("PowerUp.Spring", {
        key: "spring",
        sheetIndex: [5],
        effect: function(tank) {
            return new Layer().refineObject(tank, {
                getBulletRicochets: function() {
                    return cop.proceed() + 1;
                }
            });
        }
    });
    PowerUp.Shield = PowerUp.subclass("PowerUp.Shield", {
        key: "shield",
        sheetIndex: [4],
        effect: function(tank) {
            return new Layer().refineObject(tank, {
                destroy: function() {}
            });
        }
    });
    PowerUp.Sticky = PowerUp.subclass("PowerUp.Sticky", {
        key: "sticky",
        sheetIndex: [27],
        getTarget: function(tank) {
            return tank.world.getGameObjects().filter(function(gameObject) {
                return gameObject.name == "tank" && gameObject !== tank;
            });
        },
        effect: function(tank) {
            return new Layer().refineObject(tank, {
                move: function() {}
            });
        }
    });

    var Collectible = GameObject.subclass("Collectible", {
        initialize: function($super, world, description) {
            var pos = Vector2.fromJson(description.position);
            $super(world, "powerup", pos, new Vector2(1.5, 1.5), 0.75, Vector2.Zero.copy(), 0);

            this.powerUp = new PowerUp[description.type](description.timeout);
            this.animation = new Animation(new AnimationSheet("powerups.png", 20, 20), 1.0, this.powerUp.sheetIndex);

            this.initConstraints();
        },
        initConstraints: function() {
            // assumption: powerups are inserted right after tanks into the world
            this.world.getGameObjects().each(function(other) {
                if(other.name != "tank") { return; }

                // constraint:
                // - get powerup by touching it
                this.onCollisionWith(other, function(that, tank) {
                    that.bestow(tank);
                    that.destroy();
                });
            }, this);
        },
        bestow: function(tank) {
            this.powerUp.activate(tank);
        }
    });

    return Collectible;
});
