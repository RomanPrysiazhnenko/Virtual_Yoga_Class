document.querySelectorAll('.class-btn').forEach(button => {
    button.addEventListener('click', startClass);
});

const poses = {
    beginner: [
        {name: 'Mountain Pose', img: 'poses/mountain_pose.jpg', time: 10},
        {name: 'Downward Dog', img: 'poses/downward_dog.jpg', time: 15},
        {name: 'Warrior Pose', img: 'poses/warrior_pose.jpg', time: 20}
    ],
    relaxation: [
        {name: 'Child Pose', img: 'poses/child_pose.jpg', time: 15},
        {name: 'Corpse Pose', img: 'poses/corpse_pose.jpg', time: 30}
    ],
    advanced: [
        {name: 'Crow Pose', img: 'poses/crow_pose.jpg', time: 10},
        {name: 'Headstand', img: 'poses/headstand.jpg', time: 20},
        {name: 'Handstand', img: 'poses/handstand.jpg', time: 25}
    ]
};

let currentClass = [];
let currentPoseIndex = 0;
let countdown;

function startClass(event) {
    const selectedClass = event.target.getAttribute('data-class');
    currentClass = poses[selectedClass];
    currentPoseIndex = 0;
    document.querySelector('.class-selection').style.display = 'none';
    document.getElementById('yoga-session').style.display = 'block';
    document.getElementById('class-title').innerText = selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1) + ' Yoga';
    showPose();
}

function showPose() {
    const pose = currentClass[currentPoseIndex];
    document.getElementById('pose-image').src = pose.img;
    document.getElementById('timer').innerText = `Time: ${pose.time} seconds`;
    document.getElementById('next-btn').style.display = 'none';
    startTimer(pose.time);
}

function startTimer(seconds) {
    let timeLeft = seconds;
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = `Time: ${timeLeft} seconds`;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            document.getElementById('next-btn').style.display = 'inline-block';
        }
    }, 1000);
}

document.getElementById('next-btn').addEventListener('click', () => {
    currentPoseIndex++;
    if (currentPoseIndex < currentClass.length) {
        showPose();
    } else {
        endClass();
    }
});

function endClass() {
    document.getElementById('timer').innerText = 'Class Complete! Well done!';
    document.getElementById('next-btn').style.display = 'none';
}
