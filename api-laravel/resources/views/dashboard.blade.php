<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Dashboard</title>
</head>

<body>
    <h1>Welcome, {{ auth()->user()->name ?? auth()->user()->email }}</h1>

    <p>This is your dashboard.</p>

    <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button type="submit">Logout</button>
    </form>
</body>

</html>
