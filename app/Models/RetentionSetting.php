<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RetentionSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];
}
