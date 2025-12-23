<?php 
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'General Manager',
                'email'    => 'gm@adventureworks.com',
                'password' => Hash::make('password'),
                'role'     => 'gm',
            ],
            [
                'name'     => 'Purchasing Manager',
                'email'    => 'purchasing@adventureworks.com',
                'password' => Hash::make('password'),
                'role'     => 'purchasing',
            ],
            [
                'name'     => 'Production Head',
                'email'    => 'production@adventureworks.com',
                'password' => Hash::make('password'),
                'role'     => 'production',
            ],
            [
                'name'     => 'Sales Lead',
                'email'    => 'sales@adventureworks.com',
                'password' => Hash::make('password'),
                'role'     => 'sales',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }
    }
}
