var box2d = {
	b2Vec2:Box2D.Common.Math.b2Vec2,
	b2World:Box2D.Dynamics.b2World,
	b2Body:Box2D.Dynamics.b2Body,
	b2BodyDef:Box2D.Dynamics.b2BodyDef,
	b2FixtureDef:Box2D.Dynamics.b2FixtureDef,
	b2PolygonShape:Box2D.Collision.Shapes.b2PolygonShape,
	b2CircleShape:Box2D.Collision.Shapes.b2CircleShape
};
var SCALE = 1 / 30;
var ZERO_VECTOR = new box2d.b2Vec2();
var stage;
var world;
var gravityVertical = 15;
var velocityIterations = 8;
var positionIterations = 3;
var stageWidth;
var stageHeight;
var bottomLimit;
var ballImage;
var imageRadius;
var standardRadius = 20;
var floor = new createjs.Rectangle();
var duration = 0;
var interval = 50;
var balls = [];
function initialize() {
	var canvasElement = document.getElementById("myCanvas");
	var gravity = new box2d.b2Vec2(0, gravityVertical);
	stage = new createjs.Stage(canvasElement);
	stageWidth = canvasElement.width;
	stageHeight = canvasElement.height;
	floor.width = stageWidth * 0.8;
	floor.x = (stageWidth - floor.width) / 2;
	initializeBox2D(gravity, stageWidth, stageHeight);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	preloadImage("http://jsrun.it/assets/d/O/2/a/dO2at.png");
}
function initializeBox2D(gravity, stageWidth, stageHeight) {
	world = new box2d.b2World(gravity, true);
	var floorShape = createStaticFloor(stageWidth / 2, stageHeight - standardRadius, floor.width, standardRadius, "#CCCCCC");
	stage.addChild(floorShape);
}
function tick(eventObject) {
	var delta = eventObject.delta;
	addBall(delta);
	update(delta);
	stage.update();
}
function addBall(delta) {
	duration += delta;
	if (duration > interval) {
		var nX = floor.width * Math.random() + floor.x;
		var nY = -stageHeight * Math.random();
		var radius = 10 * (Math.random() - 0.5) + standardRadius;
		var ball = getDynamicBall(nX, nY, radius);
		stage.addChild(ball);
		duration = 0;
	}
}
function getDynamicBall(nX, nY, radius) {
	var ball;
	if (balls.length) {
		var body = balls.pop();
		body.SetActive(true);
		body.SetLinearVelocity(ZERO_VECTOR);
		body.SetAngularVelocity(0);
		body.SetPositionAndAngle(new box2d.b2Vec2(nX * SCALE, nY * SCALE), 0);
		ball = body.GetUserData();
	} else {
		ball = createDynamicBall(nX, nY, radius);
	}
	return ball;
}
function createDynamicBall(nX, nY, radius) {
	var dynamicBody = box2d.b2Body.b2_dynamicBody;
	var bodyDef = defineBody(nX, nY, dynamicBody);
	var ball = createVisualBall(radius, bodyDef);
	var circleShape = new box2d.b2CircleShape(radius * SCALE);
	var fixtureDef = defineFixture(circleShape);
	setFixture(fixtureDef, 1, 0.1, 0.8);
	createBody(world, bodyDef, fixtureDef);
	return ball;
}
function createStaticFloor(nX, nY, nWidth, nHeight, color) {
	var staticBody = box2d.b2Body.b2_staticBody;
	var bodyDef = defineBody(nX, nY, staticBody);
	var floorShape = createVisualFloor(nWidth, nHeight, color, bodyDef);
	var boxShape = new box2d.b2PolygonShape();
	var fixtureDef = defineFixture(boxShape);
	boxShape.SetAsBox(nWidth / 2 * SCALE, nHeight / 2 * SCALE);
	createBody(world, bodyDef, fixtureDef);
	return floorShape;
}
function defineBody(nX , nY, bodyType) {
	var bodyDef = new box2d.b2BodyDef();
	bodyDef.position.Set(nX * SCALE, nY * SCALE);
	bodyDef.type = bodyType;
	return bodyDef;
}
function defineFixture(myShape) {
	var fixtureDef = new box2d.b2FixtureDef();
	fixtureDef.shape = myShape;
	return fixtureDef;
}
function setFixture(fixtureDef, density, friction, restitution) {
	fixtureDef.density = density;
	fixtureDef.friction = friction;
	fixtureDef.restitution = restitution;
}
function createBody(world, bodyDef, fixtureDef) {
	var body = world.CreateBody(bodyDef);
	body.CreateFixture(fixtureDef);
}
function update(delta) {
	world.Step(delta / 1000, velocityIterations, positionIterations);
	var body = world.GetBodyList();
	while (body) {
		if (body.IsActive()) {
			var myObject = body.GetUserData();
			if (myObject) {
				var position = body.GetPosition();
				var positionY = position.y / SCALE;
				if (positionY < bottomLimit) {
					myObject.x = position.x / SCALE;
					myObject.y = positionY;
					myObject.rotation = body.GetAngle()/createjs.Matrix2D.DEG_TO_RAD;
				} else {
					body.SetActive(false);
					stage.removeChild(myObject);
					if (createjs.indexOf(balls, body) < 0) {
						balls.push(body);
					}
				}
			}
		}
		body = body.GetNext();
	}
}
function createVisualBall(radius, bodyDef) {
	var ball = new createjs.Bitmap(ballImage);
	ball.regX = ballImage.width / 2;
	ball.regY = ballImage.height / 2;
	ball.scaleX = ball.scaleY = radius / imageRadius;
	bodyDef.userData = ball;
	return ball;
}
function createVisualFloor(nWidth, nHeight, color, bodyDef) {
	var floorShape = new createjs.Shape();
	floorShape.regX = nWidth / 2;
	floorShape.regY = nHeight / 2;
	floorShape.graphics
	.beginFill(color)
	.drawRect(0, 0, nWidth, nHeight);
	bodyDef.userData = floorShape;
	return floorShape;
}
function preloadImage(file) {
	var loader = new createjs.LoadQueue(false);
	loader.addEventListener("fileload", loadFinished);
	loader.loadFile(file);
}
function loadFinished(eventObject) {
	ballImage = eventObject.result;
	imageRadius = ballImage.width / 2;
	bottomLimit = stageHeight + ballImage.height;
	createjs.Ticker.addEventListener("tick", tick);
}
initialize();