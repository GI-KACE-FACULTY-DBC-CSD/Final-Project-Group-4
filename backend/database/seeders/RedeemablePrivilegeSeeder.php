<?php

namespace Database\Seeders;

use App\Models\RedeemablePrivilege;
use Illuminate\Database\Seeder;

class RedeemablePrivilegeSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['name' => 'Library Pass', 'description' => 'One-time extended library access', 'points_cost' => 50],
            ['name' => 'Skip One Late Penalty', 'description' => 'Excuse one late mark (subject to policy)', 'points_cost' => 100],
            ['name' => 'Study Room Booking', 'description' => 'Book a study room for 2 hours', 'points_cost' => 75],
            ['name' => 'Print Credit', 'description' => '20 pages print credit', 'points_cost' => 30],
            ['name' => 'Campus Café Voucher', 'description' => 'Small drink or snack at campus café', 'points_cost' => 150],
        ];

        foreach ($defaults as $row) {
            RedeemablePrivilege::firstOrCreate(
                ['name' => $row['name']],
                [
                    'description' => $row['description'],
                    'points_cost' => $row['points_cost'],
                    'is_active' => true,
                ]
            );
        }
    }
}
