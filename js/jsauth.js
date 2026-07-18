// Wait for Firebase to be ready before allowing login/signup
let isFirebaseReady = false;

window.addEventListener("firebaseReady", () => {
  isFirebaseReady = true;
});

// ── SIGNUP ──
async function signupUser() {
  if (!isFirebaseReady) {
    alert("Loading, please wait a moment and try again");
    return;
  }

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirm").value;
  const errorEl = document.getElementById("signupError");

  errorEl.textContent = "";

  // Validation
  if (name === "" || email === "" || password === "" || confirm === "") {
    errorEl.textContent = "Please fill all fields";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters";
    return;
  }

  if (password !== confirm) {
    errorEl.textContent = "Passwords do not match";
    return;
  }

  const submitBtn = document.querySelector(".auth-btn");
  submitBtn.textContent = "Creating account...";
  submitBtn.disabled = true;

  try {
    const { createUserWithEmailAndPassword, doc, setDoc } = window.firebaseFns;
    const auth = window.firebaseAuth;
    const db = window.firebaseDB;

    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Save extra user info (name) in Firestore
    const response = await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
    });

    window.location.href = "/login";
  } catch (error) {
    submitBtn.textContent = "Create Account";
    submitBtn.disabled = false;

    // Friendly error messages
    if (error.code === "auth/email-already-in-use") {
      errorEl.textContent = "Email already registered. Please login.";
    } else if (error.code === "auth/invalid-email") {
      errorEl.textContent = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      errorEl.textContent = "Password is too weak";
    } else {
      errorEl.textContent = "Something went wrong. Try again.";
      console.error(error);
    }
  }
}

// ── LOGIN ──
async function loginUser() {
  if (!isFirebaseReady) {
    alert("Loading, please wait a moment and try again");
    return;
  }

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  errorEl.textContent = "";

  if (email === "" || password === "") {
    errorEl.textContent = "Please fill all fields";
    return;
  }

  const submitBtn = document.querySelector(".auth-btn");
  submitBtn.textContent = "Logging in...";
  submitBtn.disabled = true;

  try {
    const { signInWithEmailAndPassword, doc, getDoc } = window.firebaseFns;
    const db = window.firebaseDB;
    const auth = window.firebaseAuth;

    // extract user id (uid) from auth response
    const response = await signInWithEmailAndPassword(auth, email, password);
    const { uid = "" } = response?.user;

    // once uid found, get database entry with uid from "users" collection
    const user = await getDoc(doc(db, "users", uid));

    // save database response to local storage
    localStorage.setItem("loggedInUser", JSON.stringify(user.data()));

    // Redirect to dashboards
    window.location.href = "/dashboard";
  } catch (error) {
    submitBtn.textContent = "Login";
    submitBtn.disabled = false;

    // Friendly error messages
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password"
    ) {
      errorEl.textContent = "Incorrect email or password";
    } else if (error.code === "auth/user-not-found") {
      errorEl.textContent = "No account found. Please sign up.";
    } else if (error.code === "auth/invalid-email") {
      errorEl.textContent = "Invalid email address";
    } else if (error.code === "auth/too-many-requests") {
      errorEl.textContent = "Too many attempts. Try again later.";
    } else {
      errorEl.textContent = "Something went wrong. Try again.";
      console.error(error);
    }
  }
}

// ── PASSWORD TOGGLE ──
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);

  if (input.type === "password") {
    // Show password
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    // Hide password
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Login page toggle
const toggleLogin = document.getElementById("toggleLoginPassword");
if (toggleLogin) {
  toggleLogin.addEventListener("click", () => {
    togglePassword("loginPassword", "toggleLoginPassword");
  });
}

// Signup page toggles
const toggleSignup = document.getElementById("toggleSignupPassword");
if (toggleSignup) {
  toggleSignup.addEventListener("click", () => {
    togglePassword("signupPassword", "toggleSignupPassword");
  });
}

const toggleConfirm = document.getElementById("toggleSignupConfirm");
if (toggleConfirm) {
  toggleConfirm.addEventListener("click", () => {
    togglePassword("signupConfirm", "toggleSignupConfirm");
  });
}
