<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

// ✅ Import your seeders
use Database\Seeders\AttendanceSystemSeeder;
use Database\Seeders\RedeemablePrivilegeSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AttendanceSystemSeeder::class,
            RedeemablePrivilegeSeeder::class,
        ]);
    }
}