﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Bargio.Data;
using Bargio.Models;

namespace Bargio.Areas.Admin.Pages.EditDatabase.Utilisateurs
{
    public class DetailsModel : PageModel
    {
        private readonly Bargio.Data.ApplicationDbContext _context;

        public DetailsModel(Bargio.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public UserData UserData { get; set; }

        public async Task<IActionResult> OnGetAsync(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            UserData = await _context.UserData.FirstOrDefaultAsync(m => m.UserName == id);

            if (UserData == null)
            {
                return NotFound();
            }
            return Page();
        }
    }
}
