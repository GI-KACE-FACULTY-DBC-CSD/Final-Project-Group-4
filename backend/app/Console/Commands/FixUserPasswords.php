<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class FixUserPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:fix-passwords';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix double-hashed passwords for existing users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing user passwords...');

        $users = User::all();
        $fixed = 0;

        foreach ($users as $user) {
            // Set password directly - the 'hashed' cast will handle hashing
            $user->password = 'password';
            $user->save();
            $fixed++;
            $this->info("Fixed password for: {$user->email}");
        }

        $this->info("Fixed {$fixed} user(s). All passwords are now set to 'password'");
        $this->warn('Please change these passwords after testing!');
    }
}
