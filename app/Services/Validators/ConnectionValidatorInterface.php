<?php

namespace App\Services\Validators;

interface ConnectionValidatorInterface
{
    public function validate(array $credentials): bool;
}
