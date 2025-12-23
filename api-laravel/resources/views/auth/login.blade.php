<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Login</title>
</head>

<body>
    <h1>Login</h1>
    <form method="POST" action="{{ route('login.attempt') }}">
        @csrf

        <div>
            <label for="email">Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus>
            @error('email')
                <div style="color:red">{{ $message }}</div>
            @enderror
        </div>

        <div>
            <label for="password">Password</label>
            <input id="password" type="password" name="password" required autocomplete="current-password">
            @error('password')
                <div style="color:red">{{ $message }}</div>
            @enderror
        </div>

        <div>
            <label for="remember">
                <input id="remember" type="checkbox" name="remember"> Remember me
            </label>
        </div>

        <div>
            <button type="submit">Log in</button>
        </div>
    </form>
</body>

</html>
